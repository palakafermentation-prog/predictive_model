"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NEXT_PUBLIC_API_BASE_URL } from "@/lib/env";

export interface QueueStatus {
  position: number;
  estimatedWaitMs: number;
  complete?: boolean;
  processedRows?: number;
  totalRows?: number;
}

const POLL_INTERVAL_MS = 2_000;

/**
 * Polls GET /api/queue/status?id=<requestId> every 2 seconds.
 *
 * Returns the current queue status while the request is pending.
 * Returns null when requestId is null, the request is not found (404),
 * or a network error occurs.
 *
 * Polling stops automatically on 404 (request completed or expired).
 */
export function usePredictionQueue(requestId: string | null): QueueStatus | null {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/queue/status?id=${encodeURIComponent(id)}`, {
        credentials: "include",
      });

      if (!res.ok) return; // 404 or other error — keep polling, cleanup handles stop

      const json = await res.json() as { data: QueueStatus };

      if (json.data.complete) {
        // Request completed — stop polling
        setStatus(null);
        stopPolling();
        return;
      }

      setStatus(json.data);
    } catch {
      // Network error — keep polling, do not reset status
    }
  }, [stopPolling]);

  useEffect(() => {
    if (!requestId) {
      setStatus(null);
      stopPolling();
      return;
    }

    // Immediate first poll
    void poll(requestId);

    intervalRef.current = setInterval(() => void poll(requestId), POLL_INTERVAL_MS);

    return () => stopPolling();
  }, [requestId, poll, stopPolling]);

  return status;
}
