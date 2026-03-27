# 🧠 Guia de Configuração Dinâmica de IA

Este documento explica como gerenciar o modelo de Inteligência Artificial do Tirilo (SaaS e Robô) sem precisar alterar o código-fonte, utilizando a tabela `saas_config_global` no Supabase.

## 1. Onde Alterar o Modelo?

Acesse o dashboard do Supabase e localize a tabela:
**Tabela**: `public.saas_config_global`

### Como mudar o modelo padrão:
1. Localize a linha onde `key` é `gemini_model_default`.
2. Edite o campo `value` (formato JSONB).
   - **Exemplo**: `"gemini-3.1-flash-lite-preview"` (inclua as aspas duplas pois é um valor JSON string).
3. Salve a alteração.

---

## 2. Impacto da Mudança

| Componente | Comportamento |
| :--- | :--- |
| **SaaS (Plano/Relatório)** | A mudança é instantânea. Na próxima geração de plano/relatório, o novo modelo será invocado. |
| **Robô Tirilo** | O robô carrega a configuração no **boot** (quando o script inicia). Para aplicar a mudança, o robô deve ser reiniciado ou aguardar o próximo ciclo de sincronização (se implementado). |

---

## 3. Modelos Suportados (Março 2026)

Atualmente, o Tirilo está otimizado para a família Gemini 3.1:

- `gemini-3.1-flash-lite-preview`: Modelo atual de alta performance e baixo custo (padrão).
- `gemini-1.5-flash`: Modelo estável anterior (fallback secundário).

> [!IMPORTANT]
> Sempre use o sufixo `-preview` para modelos em fase beta/preview conforme exigido pela API do Google.

---

## 4. Prompts por Categoria

Além do modelo global, você pode definir modelos específicos para cada prompt na tabela `public.prompts_ia`. Se o campo `modelo_gemini` estiver preenchido em um prompt, ele terá prioridade sobre o modelo global definido em `saas_config_global`.

---

## 5. Troubleshooting (IA)

### Erro 404 Not Found
- Verifique se o nome do modelo está escrito corretamente (ex: esqueceu o `-preview`).
- Verifique se a chave de API (Google AI) tem permissão para usar esse modelo específico.

### Robô não muda de modelo
- Reinicie o script do robô: `sudo systemctl restart tirilo` (ou comando equivalente).
