export const GEMINI_MODEL_VERSION = 'gemini-3.1-flash-lite' // GA desde mai/2026

 // Configuration notes:
 // Since 20/03/2026, the active model is primarily fetched from the
 // 'saas_config_global' table in the database (key: 'gemini_model_default').
 // This constant serves as a safe local fallback if the database is unreachable.

// CRITICAL: Google deactivated Gemini 1.5 and 2.0/2.5 on June 1st, 2026.
// Preview 'gemini-3.1-flash-lite-preview' desativado em 25/05/2026.
// Usar apenas 'gemini-3.1-flash-lite' (GA) ou 'gemini-3.1-pro' para esta aplicação.
