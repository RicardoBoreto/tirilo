UPDATE prompts_ia 
SET modelo_gemini = 'gemini-1.5-flash' 
WHERE modelo_gemini = 'gemini-2.5-flash' OR modelo_gemini = 'gemini-2.0-flash';
