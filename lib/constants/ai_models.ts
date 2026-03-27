export const GEMINI_MODEL_VERSION = 'gemini-3.1-flash-lite-preview' // Fallback pattern

// Configuration notes:
// Since 20/03/2026, the active model is primarily fetched from the 
// 'saas_config_global' table in the database (key: 'gemini_model_default').
// This constant serves as a safe local fallback if the database is unreachable.
