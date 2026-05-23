export const extractArray = (payload) => (
  Array.isArray(payload) ? payload : []
);

export const extractPageContent = (payload) => (
  Array.isArray(payload?.content) ? payload.content : []
);

export const extractCollectionPayload = (payload) => (
  Array.isArray(payload) ? payload : extractPageContent(payload)
);

export async function readJsonPayload(response) {
  const contentType = response?.headers?.get?.("content-type") || "";
  const lowerContentType = contentType.toLowerCase();
  const isJsonResponse = !contentType || lowerContentType.includes("json");

  if (!isJsonResponse) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}
