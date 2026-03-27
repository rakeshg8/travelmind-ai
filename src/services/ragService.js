import { supabase } from "../config/supabase";
import { generateEmbedding } from "./cohereService";

export async function getLocalContext(query, city) {
  try {
    const embedding = await generateEmbedding(`${city} ${query}`, "search_query");
    const { data, error } = await supabase.rpc("match_places", {
      query_embedding: embedding,
      match_city: city,
      match_count: 5,
    });

    if (error) {
      throw error;
    }

    if (!data?.length) {
      return `No curated context found for ${city}.`;
    }

    return data
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.place_name} (${item.category})\n` +
          `Description: ${item.description}\n` +
          `Address: ${item.address}\n` +
          `Budget: ${item.budget_level}, Best Time: ${item.best_time}\n` +
          `Tags: ${(item.tags || []).join(", ")}\n` +
          `Similarity: ${(item.similarity * 100).toFixed(1)}%`
      )
      .join("\n\n");
  } catch (error) {
    throw new Error(`RAG context fetch failed: ${error.message}`);
  }
}
