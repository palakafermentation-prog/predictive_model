/**
 * Python Worker Pool
 *
 * Manages a fixed pool of long-lived Python worker processes. Each worker
 * communicates via stdin/stdout JSON lines. Requests exceeding worker capacity
 * are held in a FIFO queue.
 *
 * Architecture:
 *   Node → worker.stdin  : { id: string; data: PredictionRequest }\n
 *   worker.stdout → Node : { id: string; result: PredictionResponse }\n
 *                        | { id: string; error: string }\n
 *   worker.stdout (init) : { ready: true }\n
 *
 * Singleton: follows the same globalThis pattern as src/lib/prisma.ts so that
 * hot-reload in development doesn't spawn duplicate pools.
 */

import { type ChildProcess, spawn } from "child_process";
import * as path from "path";
import * as readline from "readline";

import type { PredictionRequest, PredictionResponse } from "@pferm/shared-schemas";

import { ServiceUnavailableError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = process.cwd();
const WORKER_SCRIPT = path.join(PROJECT_ROOT, "ai", "worker.py");
const ROLLING_WINDOW_SIZE = 20; // number of recent durations used for wait estimation
const RESPAWN_DELAY_MS = 500;
const MAX_CONSECUTIVE_FAILURES = 3;
const PERMANENT_SPAWN_ERRORS = new Set(["ENOENT", "EACCES", "EPERM"]);
const COMPLETED_TTL_MS = 30_000; // how long to remember completed request IDs

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface PendingRequest {
  id: string;
  resolve: (value: PredictionResponse) => void;
  reject: (reason: Error) => void;
  startedAt: number;
}

interface QueueEntry {
  id: string;
  data: PredictionRequest;
  resolve: (value: PredictionResponse) => void;
  reject: (reason: Error) => void;
}

interface WorkerSlot {
  proc: ChildProcess;
  rl: readline.Interface;
  ready: boolean;
  pending: PendingRequest | null;
}

// ---------------------------------------------------------------------------
// Pool class
// ---------------------------------------------------------------------------

export class PythonWorkerPool {
  private readonly workerCount: number;
  private readonly pythonExec: string;
  private slots: Array<WorkerSlot | null> = [];
  private queue: QueueEntry[] = [];
  private recentDurationsMs: number[] = [];
  private consecutiveFailures: number[] = [];
  private permanentlyFailed: boolean[] = [];
  private completedIds: Map<string, number> = new Map();

  constructor(workerCount: number, pythonExec: string) {
    this.workerCount = workerCount;
    this.pythonExec = pythonExec;
  }

  start(): void {
    this.slots = new Array(this.workerCount).fill(null);
    this.consecutiveFailures = new Array(this.workerCount).fill(0);
    this.permanentlyFailed = new Array(this.workerCount).fill(false);
    for (let i = 0; i < this.workerCount; i++) {
      this._spawnWorker(i);
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Dispatch a prediction request to an available worker, or queue it.
   * Returns a Promise that resolves when the worker responds.
   */
  dispatch(requestId: string, data: PredictionRequest): Promise<PredictionResponse> {
    if (this._isPoolDead()) {
      return Promise.reject(
        new Error(
          "AI worker pool is unavailable. All workers failed to start. " +
          "Run `pnpm setup:ai` to configure the Python environment.",
        ),
      );
    }
    return new Promise<PredictionResponse>((resolve, reject) => {
      this.queue.push({ id: requestId, data, resolve, reject });
      this._tryDispatch();
    });
  }

  /**
   * Returns the queue position (1-based) and estimated wait for a request,
   * or null if the requestId is unknown.
   * position = 0 means the request is currently being processed.
   */
  getQueueStatus(requestId: string): { position: number; estimatedWaitMs: number; complete?: boolean } | null {
    // Check if currently being processed
    const processing = this.slots.some(s => s?.pending?.id === requestId);
    if (processing) {
      return { position: 0, estimatedWaitMs: 0 };
    }

    const queueIndex = this.queue.findIndex(e => e.id === requestId);
    if (queueIndex !== -1) {
      const position = queueIndex + 1;
      const avgMs = this._rollingAvgMs();
      const estimatedWaitMs = Math.ceil(queueIndex / Math.max(1, this._activeWorkerCount())) * avgMs;
      return { position, estimatedWaitMs };
    }

    // Check recently completed
    if (this.completedIds.has(requestId)) {
      return { position: 0, estimatedWaitMs: 0, complete: true };
    }

    return null;
  }

  /** Returns a snapshot of pool utilisation. */
  getPoolStatus(): { workers: number; active: number; queued: number } {
    const active = this.slots.filter(s => s?.pending !== null).length;
    return { workers: this.workerCount, active, queued: this.queue.length };
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private _spawnWorker(index: number): void {
    // Least-privilege: only pass env vars the Python worker needs.
    // Avoids leaking DATABASE_URL, BETTER_AUTH_SECRET, SMTP_PASSWORD, etc.
    const workerEnv: Record<string, string | undefined> = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      LANG: process.env.LANG,
      MODEL_MODE: process.env.MODEL_MODE,
      VIRTUAL_ENV: process.env.VIRTUAL_ENV,
      PYTHONPATH: process.env.PYTHONPATH,
    };

    const proc = spawn(this.pythonExec, [WORKER_SCRIPT], {
      cwd: path.join(PROJECT_ROOT, "ai"),
      env: workerEnv as NodeJS.ProcessEnv,
      stdio: "pipe",
    });

    const rl = readline.createInterface({ input: proc.stdout!, crlfDelay: Infinity });

    const slot: WorkerSlot = { proc, rl, ready: false, pending: null };
    this.slots[index] = slot;

    rl.on("line", (line: string) => this._handleLine(index, line));

    proc.stderr?.on("data", (chunk: Buffer) => {
      process.stderr.write(`[ai-worker-${index}] ${chunk.toString()}`);
    });

    proc.on("error", (err: NodeJS.ErrnoException) => {
      const code = err.code ?? "UNKNOWN";
      if (PERMANENT_SPAWN_ERRORS.has(code)) {
        this.permanentlyFailed[index] = true;
        console.error(
          `[ai-worker-${index}] spawn failed (${code}): ${err.message}. ` +
          `Python venv not found or not executable. Run \`pnpm setup:ai\` to fix.`,
        );
      } else {
        console.error(`[ai-worker-${index}] spawn error (${code}): ${err.message}`);
      }
      // The `exit` event also fires after `error` — respawn logic stays there.
    });

    proc.on("exit", (code, signal) => {
      const exitingSlot = this.slots[index];
      this.slots[index] = null;

      // Clean up readline to prevent it firing on the new process
      exitingSlot?.rl.close();

      // Reject any in-flight request so the caller is unblocked
      if (exitingSlot?.pending) {
        exitingSlot.pending.reject(new Error("Worker process exited unexpectedly"));
      }

      this.consecutiveFailures[index]++;

      const isPermanent = this.permanentlyFailed[index];
      const exhausted = this.consecutiveFailures[index] >= MAX_CONSECUTIVE_FAILURES;

      if (isPermanent) {
        console.error(
          `[ai-worker-${index}] permanent failure — will not respawn. ` +
          `Run \`pnpm setup:ai\` to configure the Python environment.`,
        );
      } else if (exhausted) {
        console.error(
          `[ai-worker-${index}] exited (code=${code ?? "?"} signal=${signal ?? "none"}) — ` +
          `${this.consecutiveFailures[index]}/${MAX_CONSECUTIVE_FAILURES} consecutive failures, giving up`,
        );
      } else {
        console.error(
          `[ai-worker-${index}] exited (code=${code ?? "?"} signal=${signal ?? "none"}) — ` +
          `respawning (attempt ${this.consecutiveFailures[index] + 1}/${MAX_CONSECUTIVE_FAILURES})`,
        );
        setTimeout(() => this._spawnWorker(index), RESPAWN_DELAY_MS);
      }

      if (this._isPoolDead()) {
        this._rejectAllQueued();
      }
    });
  }

  private _handleLine(index: number, line: string): void {
    const slot = this.slots[index];
    if (!slot) return;

    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(line) as Record<string, unknown>;
    } catch {
      console.error(`[ai-worker-${index}] unparseable line: ${line}`);
      return;
    }

    // Startup ready signal
    if (msg.ready === true) {
      slot.ready = true;
      this.consecutiveFailures[index] = 0;
      this._tryDispatch();
      return;
    }

    // Response to pending request
    const { pending } = slot;
    if (!pending) {
      console.error(`[ai-worker-${index}] unexpected response (no pending request): ${line}`);
      return;
    }

    const durationMs = Date.now() - pending.startedAt;
    this._recordDuration(durationMs);
    this._markCompleted(pending.id);

    slot.pending = null;

    if (msg.error) {
      // Worker errors are structured: {code: "<STABLE_CODE>"}. A bare-string
      // fallback is kept for rolling-deploy scenarios where an older worker
      // is still emitting the legacy shape — it is coerced to WORKER_ERROR.
      const errObj = msg.error as { code?: string } | string;
      const code =
        typeof errObj === "object" && errObj && typeof errObj.code === "string"
          ? errObj.code
          : "WORKER_ERROR";
      console.error(`[ai-worker-${index}] worker error for ${pending.id}: code=${code}`);
      pending.reject(new ServiceUnavailableError(`AI prediction failed (${code})`));
    } else {
      pending.resolve(msg.result as PredictionResponse);
    }

    // Pick up next queued request
    this._tryDispatch();
  }

  private _tryDispatch(): void {
    while (this.queue.length > 0) {
      const slotIndex = this.slots.findIndex(s => s !== null && s.ready && s.pending === null);
      if (slotIndex === -1) break; // all workers busy

      const entry = this.queue.shift()!;
      const slot = this.slots[slotIndex]!;

      slot.pending = {
        id: entry.id,
        resolve: entry.resolve,
        reject: entry.reject,
        startedAt: Date.now(),
      };

      slot.proc.stdin!.write(JSON.stringify({ id: entry.id, data: entry.data }) + "\n");
    }
  }

  private _recordDuration(ms: number): void {
    this.recentDurationsMs.push(ms);
    if (this.recentDurationsMs.length > ROLLING_WINDOW_SIZE) {
      this.recentDurationsMs.shift();
    }
  }

  private _rollingAvgMs(): number {
    if (this.recentDurationsMs.length === 0) return 5_000; // default before any data
    return this.recentDurationsMs.reduce((a, b) => a + b, 0) / this.recentDurationsMs.length;
  }

  private _activeWorkerCount(): number {
    return this.slots.filter(s => s !== null && s.ready).length;
  }

  private _markCompleted(requestId: string): void {
    this.completedIds.set(requestId, Date.now());
    // Prune stale entries to prevent unbounded growth
    const cutoff = Date.now() - COMPLETED_TTL_MS;
    for (const [id, ts] of this.completedIds) {
      if (ts < cutoff) this.completedIds.delete(id);
      else break; // Map preserves insertion order — all remaining are newer
    }
  }

  private _isPoolDead(): boolean {
    for (let i = 0; i < this.workerCount; i++) {
      if (
        !this.permanentlyFailed[i] &&
        this.consecutiveFailures[i] < MAX_CONSECUTIVE_FAILURES
      ) {
        return false;
      }
    }
    return true;
  }

  private _rejectAllQueued(): void {
    const error = new Error(
      "AI worker pool is unavailable. All workers failed to start. " +
      "Run `pnpm setup:ai` to configure the Python environment.",
    );
    while (this.queue.length > 0) {
      const entry = this.queue.shift()!;
      entry.reject(error);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — mirrors the pattern in src/lib/prisma.ts
// ---------------------------------------------------------------------------

const globalWithPool = globalThis as unknown as { pythonWorkerPool: PythonWorkerPool | undefined };
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

function createPool(): PythonWorkerPool {
  const workerCount = Math.min(
    5,
    Math.max(1, parseInt(process.env.AI_WORKER_COUNT ?? "3", 10)),
  );
  const pythonExec =
    process.env.AI_PYTHON_EXECUTABLE ?? path.join(PROJECT_ROOT, "ai", ".venv", "bin", "python");

  const pool = new PythonWorkerPool(workerCount, pythonExec);
  pool.start();
  return pool;
}

export const pythonWorkerPool: PythonWorkerPool = isBuildPhase
  ? ({} as PythonWorkerPool)
  : (globalWithPool.pythonWorkerPool ?? createPool());

if (!isBuildPhase) globalWithPool.pythonWorkerPool = pythonWorkerPool;
