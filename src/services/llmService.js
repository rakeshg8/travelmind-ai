import axios from "axios";
import { KEYS } from "../config/keys";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const FALLBACK_MODELS = [
  "openai/gpt-oss-20b:free",
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-4b-it:free",
  "qwen/qwen3-coder:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];

function shouldTryFallback(status) {
  return [402, 403, 404, 408, 409, 425, 429, 500, 502, 503, 504].includes(status);
}

async function callModel(model, messages, headers) {
  const { data } = await axios.post(
    OPENROUTER_URL,
    {
      model,
      messages,
      temperature: 0.4,
    },
    { headers }
  );
  return data?.choices?.[0]?.message?.content || "No response generated.";
}

async function callLLM(messages) {
  const headers = {
    Authorization: `Bearer ${KEYS.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "TravelMind AI",
  };

  const attempted = [];
  const modelsToTry = [KEYS.OPENROUTER_MODEL, ...FALLBACK_MODELS].filter(
    (model, index, arr) => model && arr.indexOf(model) === index
  );

  for (let i = 0; i < modelsToTry.length; i += 1) {
    const model = modelsToTry[i];
    try {
      return await callModel(model, messages, headers);
    } catch (error) {
      const status = error?.response?.status;
      attempted.push(`${model}:${status || "unknown"}`);

      if (!shouldTryFallback(status) || i === modelsToTry.length - 1) {
        throw new Error(
          `All LLM models failed (${attempted.join(", ")}). Check VITE_OPENROUTER_API_KEY, account credits, and model availability.`
        );
      }
    }
  }

  throw new Error(
    `All LLM models failed (${attempted.join(", ")}). Check VITE_OPENROUTER_API_KEY, account credits, and model availability.`
  );
}

export async function chat(systemPrompt, userMessage) {
  try {
    return await callLLM([
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ]);
  } catch (error) {
    throw new Error(`LLM chat failed: ${error.message}`);
  }
}

export async function chatWithContext(systemPrompt, context, userMessage) {
  try {
    return await callLLM([
      { role: "system", content: systemPrompt },
      {
        role: "system",
        content: `Grounding context (must be used):\n${context}`,
      },
      { role: "user", content: userMessage },
    ]);
  } catch (error) {
    throw new Error(`LLM context chat failed: ${error.message}`);
  }
}
