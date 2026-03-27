function requireEnv(name, fallback = "") {
  const value = import.meta.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const KEYS = {
  // Firebase
  FIREBASE_API_KEY: requireEnv("VITE_FIREBASE_API_KEY"),
  FIREBASE_AUTH_DOMAIN: requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  FIREBASE_PROJECT_ID: requireEnv("VITE_FIREBASE_PROJECT_ID"),
  FIREBASE_APP_ID: requireEnv("VITE_FIREBASE_APP_ID"),

  // Supabase
  SUPABASE_URL: requireEnv("VITE_SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("VITE_SUPABASE_ANON_KEY"),

  // AI providers
  COHERE_API_KEY: requireEnv("VITE_COHERE_API_KEY"),
  OPENROUTER_API_KEY: requireEnv("VITE_OPENROUTER_API_KEY"),
  OPENROUTER_MODEL: requireEnv("VITE_OPENROUTER_MODEL", "openai/gpt-oss-20b:free"),

  // AviationStack
  AVIATIONSTACK_API_KEY: "",
  // Handled server-side via /api/flight-status Vercel proxy
  // Set AVIATIONSTACK_KEY in Vercel environment variables
};
