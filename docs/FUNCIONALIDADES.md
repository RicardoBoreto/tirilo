# 🚀 Funcionalidades do Sistema Tirilo SaaS

Este documento detalha todas as funcionalidades disponíveis no sistema Tirilo, organizadas por módulo. O sistema é uma plataforma completa para gestão de clínicas de terapias multidisciplinares (foco em TEA e Neurodesenvolvimento), com recursos avançados de Inteligência Artificial e Robótica.

---

## 🏢 1. Gestão SaaS e Clínicas (Super Admin)

Módulo destinado à administração central da plataforma (Multi-tenant) e configurações da empresa proprietária do software.

*   **Gestão de Clínicas:**
    *   Cadastro completo de clínicas (Razão Social, CNPJ, Endereço Estruturado).
    *   Upload de Logotipo e configuração de cores (Identidade Visual).
    *   Painel de estatísticas por clínica.
    *   Backup de dados em formato JSON.
*   **Configurações SaaS:**
    *   Cadastro da empresa proprietária (Tirilo) para emissão de faturas do software.
    *   Gestão de dados fiscais e contato central.

---

## 👨‍👩‍👧‍👦 2. Gestão de Pacientes e Família

Prontuário eletrônico completo e interface de comunicação com responsáveis.

*   **Prontuário Digital:**
    *   Dados pessoais completos e foto.
    *   **Vínculo com Operadoras:** Cadastro de Convênio, Número da Carteirinha e Validade.
    *   **Anamnese Digital:** Ficha detalhada de histórico clínico.
        *   *Feature IA:* Importação automática de anamneses físicas via foto/PDF (OCR + IA).
    *   **Documentos e Laudos:** Upload seguro de PDFs e laudos médicos (Bucket Privado).
*   **Gestão de Responsáveis:**
    *   Cadastro de múltiplos responsáveis (Pais, Tutores).
    *   Controle de acesso ao Portal da Família (Reset de senha/login).
*   **Portal da Família:**
    *   Acesso restrito para pais visualizarem a evolução da criança.
    *   Visualização de Agenda e Relatórios (quando liberados pelo terapeuta).

---

## 👩‍⚕️ 3. Gestão Terapêutica e Evolução

Ferramentas para o dia a dia dos terapeutas, focadas em produtividade e qualidade clínica.

*   **Agenda Inteligente:**
    *   Visualizações por Dia, Semana e Mês.
    *   Status de agendamento (Pendente, Confirmado, Concluído, Cancelado, Falta).
    *   Detecção de conflitos de horário e sala.
    *   Filtros por terapeuta e status.
*   **Relatórios de Atendimento (Evolução):**
    *   Registro detalhado de cada sessão.
    *   **Assistente de Escrita (IA):** Gera o texto técnico baseado em tópicos brutos inseridos pelo terapeuta.
    *   **Contexto Histórico:** A IA analisa os últimos 3 relatórios para sugerir continuidade.
    *   **Liberação para Família:** Controle granular de quais relatórios os pais podem ver.
    *   Geração de PDF do relatório.
*   **Planos de Intervenção (PEI):**
    *   Criação de planos terapêuticos estruturados.
    *   **Gerador IA:** Cria planos personalizados baseados na Anamnese e Objetivos do paciente.
    *   **Chat Interativo:** Permite refinamento do plano conversando com a IA ("Ajuste o objetivo para focar mais na fala").

---

## 🧠 4. Inteligência Artificial (Módulo Brain)

Recursos transversais de IA para potencializar a clínica.

*   **Modelos:** Integração com Google Gemini (versão 2.5 Flash).
*   **Prompts e Templates:**
    *   Bibliotecas de prompts compartilhados entre a clínica.
    *   Gestão de templates de relatório e planos.
*   **Text-to-Speech (TTS):** Leitura em voz alta, natural e fluida, dos planos de intervenção para acessibilidade.
*   **Visão Computacional:**
    *   Identificação de brinquedos/recursos por foto.
    *   Digitalização de documentos físicos.
*   **Privacidade:** Anonimização automática de nomes (Data Masking) antes do envio para a API da IA.

---

## 💰 5. Financeiro e Faturamento

Ciclo financeiro completo: do agendamento à quitação.

*   **Contratos e Cobrança:**
    *   Gestão de contratos por sessão ou mensalidade fixa.
    *   Geração de faturas em lote baseadas nos atendimentos "Concluídos".
*   **Convênios e Operadoras:**
    *   Cadastro de Operadoras de Saúde (CNPJ, Tabela).
    *   **Guias TISS/Assinatura:** Geração automática de guia de atendimento para assinatura do paciente, personalizada com logo da clínica e dados da operadora.
*   **Contas a Receber/Pagar:**
    *   Painel de lançamentos financeiros.
    *   **Baixa Interativa:** Modal para quitação com data real, forma de pagamento e upload de **Comprovante (Recibo/Pix)**.
    *   **Estorno:** Funcionalidade de reversão de pagamentos indevidos.
*   **Dashboard:** Visão de fluxo de caixa (Receita vs Despesa).

---

## 🧸 6. Recursos, Estoque e Robótica

Gestão de materiais de apoio e tecnologia assistiva.

*   **Inventário de Recursos:**
    *   Cadastro de brinquedos, jogos e materiais pedagógicos.
    *   Sugestão automática de uso terapêutico (Descrição e Objetivos) via IA ao cadastrar foto do objeto.
    *   Controle de localização (Sala/Armário).
*   **Frota de Robôs (Tirilo):**
    *   Cadastro e vínculo de robôs com clínicas.
    *   **Telemetria:** Monitoramento em tempo real (Online/Offline, Bateria).
    *   **Manutenção:** Gestão de Ordens de Serviço (Preventiva/Corretiva) para a frota.

---

## 👥 7. Equipe e Segurança

Controle de acesso robusto baseado em papéis (RBAC).

*   **Perfis de Acesso:**
    *   **Master/Super Admin:** Acesso total ao SaaS.
    *   **Gestor da Clínica:** Administração financeira e equipe da sua unidade.
    *   **Terapeuta:** Acesso aos seus pacientes, agenda e relatórios.
    *   **Recepção:** Gestão de agenda, check-in e cadastro básico.
*   **Segurança de Dados:**
    *   **RLS (Row Level Security):** Isolamento estrito de dados entre clínicas no banco de dados.
    *   **Audit:** Rastreabilidade de criação e edição de registros.

---

## 🆘 8. Help Desk e Suporte

Canal de comunicação interno.

*   **Sistema de Tickets:** Abertura de chamados para suporte técnico ou manutenção predial.
*   **Chat:** Comunicação direta com admin.
*   **Anexos:** Envio de prints e documentos no chamado.

---

**Gerado em:** 18/01/2026
**Versão do Sistema:** 1.10.1
