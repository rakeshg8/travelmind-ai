import axios from "axios";
import { KEYS } from "../config/keys";

const EMBED_URL = "https://api.cohere.com/v2/embed";
const embeddingCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateEmbedding(text, inputType = "search_query") {
  const normalizedText = String(text || "");
  const cacheKey = `${inputType}:${normalizedText}`;
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  try {
    const payload = {
      texts: [normalizedText],
      model: "embed-english-v3.0",
      input_type: inputType,
      embedding_types: ["float"],
    };

    let vector = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const { data } = await axios.post(EMBED_URL, payload, {
          headers: {
            Authorization: `Bearer ${KEYS.COHERE_API_KEY}`,
            "Content-Type": "application/json",
          },
        });
        vector = data?.embeddings?.float?.[0];
        break;
      } catch (requestError) {
        const status = requestError?.response?.status;
        const canRetry = status === 429 && attempt < maxAttempts;
        if (!canRetry) {
          throw requestError;
        }
        await sleep(400 * attempt);
      }
    }

    if (!Array.isArray(vector) || vector.length !== 1024) {
      throw new Error("Embedding shape mismatch. Expected 1024-dim vector.");
    }

    embeddingCache.set(cacheKey, vector);
    return vector;
  } catch (error) {
    throw new Error(`Cohere embedding failed: ${error.message}`);
  }
}
