export const GEMINI_MODEL_VERSION = 'gemini-3.1-flash-lite-preview' // Fallback pattern 2026

 // Configuration notes:
 // Since 20/03/2026, the active model is primarily fetched from the 
 // 'saas_config_global' table in the database (key: 'gemini_model_default').
 // This constant serves as a safe local fallback if the database is unreachable.

// CRITICAL: Google deactivated Gemini 1.5 and 2.0/2.5 on June 1st, 2026.
// DO NOT fallback to older models as they return 503/404 errors.
// Use only 3.1 Flash Lite or 3.1 Pro for this application.
