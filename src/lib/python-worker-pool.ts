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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = process.cwd();
const WORKER_SCRIPT = path.join(PROJECT_ROOT, "ai", "worker.py");
const ROLLING_WINDOW_SIZE = 20; // number of recent durations used for wait estimation
const RESPAWN_DELAY_MS = 500;

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

  constructor(workerCount: number, pythonExec: string) {
    this.workerCount = workerCount;
    this.pythonExec = pythonExec;
  }

  start(): void {
    this.slots = new Array(this.workerCount).fill(null);
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
  getQueueStatus(requestId: string): { position: number; estimatedWaitMs: number } | null {
    // Check if currently being processed
    const processing = this.slots.some(s => s?.pending?.id === requestId);
    if (processing) {
      return { position: 0, estimatedWaitMs: 0 };
    }

    const queueIndex = this.queue.findIndex(e => e.id === requestId);
    if (queueIndex === -1) return null;

    const position = queueIndex + 1;
    const avgMs = this._rollingAvgMs();
    // Estimate: number of full batches ahead of this request × avg duration
    const estimatedWaitMs = Math.ceil(queueIndex / Math.max(1, this._activeWorkerCount())) * avgMs;

    return { position, estimatedWaitMs };
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
    const proc = spawn(this.pythonExec, [WORKER_SCRIPT], {
      cwd: path.join(PROJECT_ROOT, "ai"),
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const rl = readline.createInterface({ input: proc.stdout!, crlfDelay: Infinity });

    const slot: WorkerSlot = { proc, rl, ready: false, pending: null };
    this.slots[index] = slot;

    rl.on("line", (line: string) => this._handleLine(index, line));

    proc.stderr?.on("data", (chunk: Buffer) => {
      process.stderr.write(`[ai-worker-${index}] ${chunk.toString()}`);
    });

    proc.on("exit", (code, signal) => {
      const exitingSlot = this.slots[index];
      console.error(`[ai-worker-${index}] exited (code=${code ?? "?"} signal=${signal ?? "none"}) — respawning`);

      // Clean up readline to prevent it firing on the new process
      exitingSlot?.rl.close();

      // Reject any in-flight request so the caller is unblocked
      if (exitingSlot?.pending) {
        exitingSlot.pending.reject(new Error("Worker process exited unexpectedly"));
      }

      this.slots[index] = null;

      setTimeout(() => this._spawnWorker(index), RESPAWN_DELAY_MS);
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

    slot.pending = null;

    if (msg.error) {
      pending.reject(new Error(String(msg.error)));
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
