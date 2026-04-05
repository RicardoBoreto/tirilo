## Biometria Vocal (v4.13)

**Programas envolvidos:**
- `/robo_tirilo/tirilo.py` — programa principal
- `/robo_tirilo/ferramentas/biometria_setup_gui.py` — registra a voz do usuário (GUI touchscreen)
- `/robo_tirilo/ferramentas/biometria_setup.py` — registra a voz via terminal
- `/robo_tirilo/ferramentas/biometria_treino.py` — treina o modelo de reconhecimento de voz
- `/robo_tirilo/ferramentas/biometria_teste.py` — testa o reconhecimento de voz

**Como funciona:**

Quando o robô ouve uma palavra que corresponde ao nome de um jogo carregado da tabela `saas_jogos`, ele verifica o campo `descricao_regras` do jogo:

- Se contiver `{administrador}` → verifica se quem falou é o administrador cadastrado
- Se contiver `{terapeuta}` → verifica se quem falou é o terapeuta cadastrado
- Se a verificação falhar → passa para a IA responder normalmente
- Se não houver chave de permissão → executa o jogo diretamente

A verificação reutiliza o próprio áudio já capturado (`/tmp/voz_usuario.wav`) — não pede nova gravação. O modelo usado é o `wespeaker_en_voxceleb_resnet34.onnx` via sherpa-onnx. Limiar de similaridade cosseno: **0.50**.

Os perfis biométricos ficam em:
- `/home/boreto/projeto_robo/robo_tirilo/biometria/perfil_admin.bin`
- `/home/boreto/projeto_robo/robo_tirilo/biometria/perfil_terapeuta.bin`

**Flag de rastreamento facial:**

O campo `desativar_rastreamento` (BOOLEAN) na tabela `saas_jogos` permite desativar o rastreamento facial durante a execução de um jogo. Isso é essencial para coreografias como `coreografia_seulobato`, onde os olhos piscam conforme a música e o rastreamento interferiria nos movimentos.

Configure este campo pelo painel SaaS em **Gerenciar Aplicativos → Detalhes → "Desativar Rastreamento Facial durante o jogo"**.

**Comportamento seguro (fail-open):**

Se o modelo ONNX ou o perfil biométrico não estiver cadastrado, o robô permite o acesso e loga um aviso — nunca bloqueia por ausência de configuração.
