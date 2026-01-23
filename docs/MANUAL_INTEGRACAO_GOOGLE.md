# 📅 Manual de Integração Google Calendar

Este documento descreve o processo necessário para habilitar a sincronização de agenda para os terapeutas do sistema Tirilo.

## ⚠️ Estado Atual: Modo de Teste (Sandbox)

O aplicativo no Google Cloud está configurado atualmente como **"External" (Externo)** porem em **"Testing" (Teste)**.

**Limitação:** Enquanto estiver neste estado, **APENAS** os usuários explicitamente cadastrados na lista de "Test Users" no Google Cloud Console conseguirão fazer login. Qualquer outro e-mail receberá o erro `403: access_denied`.

---

## 🛠️ Processo para o Administrador (Você)

Para cada novo terapeuta que precisar usar a integração **AGORA**, você deve seguir estes passos:

1.  Acesse o **[Google Cloud Console](https://console.cloud.google.com/)**.
2.  Certifique-se de estar no projeto correto (**SaaSTirilo**).
3.  No menu lateral, navegue até **"APIs e Serviços"** > **"Tela de permissão OAuth"** (OAuth consent screen).
4.  Role até a seção **"Usuários de teste"** (Test users).
5.  Clique em **"+ ADD USERS"**.
6.  Digite o e-mail Google do terapeuta (ex: `terapeuta.joao@gmail.com`).
7.  Clique em **Salvar**.

*Repita isso para cada terapeuta que for testar ou usar o sistema nesta fase.*

---

## 🚀 Processo para Produção (Definitivo)

Para **não precisar** adicionar cada e-mail manualmente no futuro e liberar o acesso para **qualquer usuário** com uma conta Google:

1.  No mesmo menu **"Tela de permissão OAuth"**:
2.  Clique no botão **"PUBLISH APP"** (Publicar aplicativo).
3.  **Verificação do Google:**
    *   Como o aplicativo usa escopos sensíveis (`calendar`), o Google exigirá uma verificação.
    *   Você terá que enviar um vídeo demonstrando o uso da funcionalidade.
    *   Terá que fornecer link para Política de Privacidade no site do Tirilo.
4.  Após a aprovação do Google, o limite de 100 usuários de teste é removido e qualquer pessoa pode se conectar.

---

## 👤 Instruções para o Terapeuta

Envie estas instruções para o terapeuta após ter liberado o e-mail dele (na fase de teste):

> "Olá! Para conectar sua agenda do Google ao Sistema Tirilo:
>
> 1.  Acesse a página da **Agenda** no sistema.
> 2.  Clique no botão **'Sincronizar Google'** no topo da tela.
> 3.  Faça login com sua conta Google (a mesma que você nos informou).
> 4.  **Atenção:** Como estamos em fase de testes, o Google pode exibir uma tela de aviso dizendo *'O Google não verificou este app'*.
> 5.  Se isso acontecer, clique em **'Avançado'** (Advanced) e depois no link **'Acessar saas-tirilo (não seguro)'** no rodapé para prosseguir.
> 6.  Na tela de permissões, marque todas as caixas para permitir que o sistema gerencie seus eventos.
> 7.  Clique em **Continuar**.
>
> Pronto! O botão ficará verde ('Sincronizado') e seus novos agendamentos aparecerão automaticamente no Google Agenda."

---

## 📋 Resolução de Problemas Comuns

| Problema | Causa Provável | Solução |
| :--- | :--- | :--- |
| **Erro 403: access_denied** | E-mail não cadastrado nos Test Users. | Adicione o e-mail no Google Cloud Console. |
| **Erro: redirect_uri_mismatch** | URL do sistema mudou (ex: produção vs local). | Adicione a nova URL em "Credenciais" > "IDs do cliente OAuth". |
| **Botão não fica verde** | Erro ao salvar tokens no banco. | Verifique os logs do servidor e se a tabela `saas_integracoes_google` existe. |
