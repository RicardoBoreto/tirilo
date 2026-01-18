
# 🤖 Manual de Gestão de Frotas e Acesso Seguro

Este manual descreve como utilizar o painel de **Gestão de Robôs** para administrar a frota Tirilo e configurar o acesso remoto seguro via Tailscale.

## 1. Acessando a Gestão
1. Faça login como **Administrador** da Clínica ou **Super Admin**.
2. Navegue até o menu **Equipe/Robótica** ou acesse `/admin/robo`.

## 2. Cadastro e Edição de Robôs
No painel, você verá a lista de robôs à esquerda.
*   **Adicionar Novo:** Preencha MAC e Nome no topo da lista.
*   **Editar:** Selecione um robô e clique no botão azul **Editar** no canto superior direito do card de detalhes.

## 3. Configurando Acesso Seguro (Tailscale) 🔒
Para permitir suporte remoto e diagnóstico via SSH, você precisa vincular o endereço IP da rede VPN Tailscale ao cadastro do robô.

1.  Selecione o robô desejado.
2.  Clique em **Editar**.
3.  Role até a seção **Conectividade (Admin)** (fundo amarelo).
4.  Preencha:
    *   **Tailscale IP:** O endereço IP atribuído pelo Tailscale (ex: `100.101.102.103`).
    *   **Usuário SSH:** O usuário Linux do robô (padrão: `pi`).
5.  Clique em **Salvar Alterações**.

## 4. Monitoramento e Acesso Remoto
Uma vez configurado, o painel exibe o status em tempo real e ferramentas de acesso.

### Status Online 🟢
*   **Monitoramento Contínuo:** O status fica verde se o robô enviou sinais ("heartbeat") nos últimos 120 segundos.
*   **Verificação Ativa (Ping):** Ao clicar em um robô na lista, o sistema envia automaticamente um comando de **PING**. Se o robô estiver conectado, ele responderá instantaneamente, forçando a atualização do status para ONLINE e confirmando a comunicação bidirecional.

### Acesso SSH
*   Um botão **Copiar Comando SSH** estará disponível para obter a string de conexão (ex: `ssh pi@100.x.y.z`).
*   Cole este comando no seu Terminal (PowerShell ou Bash) para acessar o robô.
    *   *Nota: Você deve estar conectado à mesma rede Tailscale no seu computador.*

## 5. Comandos Rápidos
O painel permite enviar comandos instantâneos para teste:
*   🗣️ **Dizer Olá:** Testa o sistema de TTS (Fala).
*   🎨 **Jogos:** Inicia atividades específicas.
*   🛑 **Parar Tudo:** Interrompe qualquer atividade em curso.

---
## 6. Solução de Problemas (Troubleshooting)

### Robô está ligado mas aparece OFFLINE
1.  **Verifique a Internet:** O robô precisa de acesso à rede.
2.  **Verifique o Script:** O script Python `main.py` deve estar em execução.
3.  **Permissões de Banco (RLS):** Se o robô recebe comandos (fala/joga) mas não fica verde, ele pode estar bloqueado de enviar respostas.
    *   *Solução:* Solicite ao administrador que execute o script SQL de permissões (`FIX_PERMISSOES_ROBO.sql`) no Supabase para liberar o `INSERT` na tabela `sessao_telemetria`.

### Falha no Acesso SSH
*   Verifique se o seu computador e o robô estão na mesma rede Tailscale.
*   Verifique se o serviço está rodando no robô: `systemctl status tailscaled`.

