"""
Python AI worker — stdin/stdout JSON line protocol.

Protocol:
  Startup: writes {"ready": true} to stdout once the model is loaded.
  Request: reads {"id": "<uuid>", "data": {<PredictionRequest fields>}} from stdin.
  Response: writes {"id": "<uuid>", "result": {<PredictionResponse fields>}} to stdout.
  Error:    writes {"id": "<uuid>", "error": {"code": "<STABLE_CODE>"}} to stdout.
            Raw exception text is written to stderr via logging, never to stdout.

All logging goes to stderr so it does not contaminate the JSON line stream.
"""

import json
import logging
import os
import signal
import sys

# Configure logging to stderr only — stdout is reserved for the JSON protocol
logging.basicConfig(
    stream=sys.stderr,
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("worker")

# Import predictor at module level — loads the model into memory once at startup
from ml.predictor import PalakaInferenceError, predict
from schemas import PredictionRequest

_shutdown = False


def _handle_sigterm(signum: int, frame: object) -> None:
    global _shutdown
    logger.info("SIGTERM received — shutting down after current request")
    _shutdown = True


signal.signal(signal.SIGTERM, _handle_sigterm)

# Signal to the Node pool that this worker is ready to accept requests
sys.stdout.write(json.dumps({"ready": True}) + "\n")
sys.stdout.flush()
logger.info("Worker ready (MODEL_MODE=%s)", os.environ.get("MODEL_MODE", "mock"))


def _process_line(line: str) -> str:
    """Parse one request line and return a response line."""
    request_id: str = ""
    try:
        envelope = json.loads(line)
        request_id = str(envelope.get("id", ""))
        data = envelope.get("data", {})

        request = PredictionRequest(**data)
        response = predict(request)

        return json.dumps({"id": request_id, "result": response.model_dump()})
    except PalakaInferenceError as exc:
        logger.exception("palaka inference error for request %s", request_id)
        return json.dumps({"id": request_id, "error": {"code": f"PALAKA_{exc.code}"}})
    except Exception:
        logger.exception("Error processing request %s", request_id)
        return json.dumps({"id": request_id, "error": {"code": "WORKER_ERROR"}})


def main() -> None:
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue

        response_line = _process_line(line)
        sys.stdout.write(response_line + "\n")
        sys.stdout.flush()

        if _shutdown:
            logger.info("Shutdown flag set — exiting")
            break

    logger.info("Worker exiting")


if __name__ == "__main__":
    main()
