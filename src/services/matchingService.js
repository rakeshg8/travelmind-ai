import { supabase } from "../config/supabase";
import { generateEmbedding } from "./cohereService";

function toPercent(score = 0) {
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

export async function createSoloPost(userId, postData) {
  try {
    const { error: deactivateError } = await supabase
      .from("solo_posts")
      .update({ is_active: false })
      .eq("user_id", userId);

    if (deactivateError) {
      throw deactivateError;
    }

    const text = `${postData.destination} ${postData.travel_purpose} ${postData.budget_range} ${(postData.interests || []).join(" ")}`;
    const profile_embedding = await generateEmbedding(text, "search_document");

    const { data, error } = await supabase
      .from("solo_posts")
      .insert({
        user_id: userId,
        destination: postData.destination,
        travel_date: postData.travel_date,
        budget_range: postData.budget_range,
        interests: postData.interests,
        travel_purpose: postData.travel_purpose,
        gender_pref: postData.gender_pref || "any",
        profile_embedding,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    throw new Error(`Create solo post failed: ${error.message}`);
  }
}

export async function findMatches(userId, soloPost) {
  try {
    const text = `${soloPost.destination} ${soloPost.travel_purpose} ${soloPost.budget_range} ${(soloPost.interests || []).join(" ")}`;
    const embedding = await generateEmbedding(text, "search_query");

    const { data, error } = await supabase.rpc("match_solo_travelers", {
      query_embedding: embedding,
      match_count: 10,
    });

    if (error) {
      throw error;
    }

    const candidates = (data || []).filter((row) => row.user_id !== userId);
    const userIds = [...new Set(candidates.map((row) => row.user_id))];

    if (!userIds.length) {
      return [];
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, bio, interests")
      .in("id", userIds);

    if (usersError) {
      throw usersError;
    }

    const map = new Map((users || []).map((user) => [user.id, user]));

    return candidates.map((match) => ({
      ...match,
      user: map.get(match.user_id) || null,
      matchPercent: toPercent(match.similarity),
    }));
  } catch (error) {
    if (String(error?.message || "").toLowerCase().includes("structure of query does not match function result type")) {
      throw new Error(
        "Find matches failed: Supabase function signature mismatch. Recreate match_solo_travelers() to return user_id as TEXT after Firebase UID migration."
      );
    }
    throw new Error(`Find matches failed: ${error.message}`);
  }
}
