import { AI_SERVICE_URL } from "./env";

const AI_TIMEOUT_MS = 30_000;

/**
 * Call the AI service. Returns mock responses when AI_SERVICE_URL is not configured.
 */
export async function callAiService<T>(path: string, body: unknown, mockResponse: T): Promise<T> {
  if (!AI_SERVICE_URL) {
    return mockResponse;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Prediction service is not responding. Please try again later.");
    }
    throw new Error("Could not connect to prediction service.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Prediction service returned an error (${response.status}). Please try again.`);
  }

  return response.json() as Promise<T>;
}
