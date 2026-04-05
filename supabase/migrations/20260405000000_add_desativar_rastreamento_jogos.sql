-- Migration: adiciona flag desativar_rastreamento à tabela saas_jogos
-- Versão Tirilo: 4.13 | Data: 05/04/2026
--
-- Quando TRUE, o robô pausa o rastreamento facial durante a execução do jogo.
-- Essencial para coreografias onde os olhos são controlados pela música
-- e o rastreamento facial interferiria nos movimentos.

ALTER TABLE public.saas_jogos
    ADD COLUMN IF NOT EXISTS desativar_rastreamento BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.saas_jogos.desativar_rastreamento
IS 'Se TRUE, o robô Tirilo desativa o rastreamento facial durante o jogo. Use em coreografias e jogos que controlam os olhos independentemente.';
