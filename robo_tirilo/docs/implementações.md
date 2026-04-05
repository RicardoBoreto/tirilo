## Sincronia de Coreografias e Fix de Jitter no Rastreamento (v4.14/v4.15 — 2026-04-05)

**Programas envolvidos:**
- `/robo_tirilo/tirilo.py` — programa principal
- `/robo_tirilo/olhos_tirilo.py` — controlador de hardware (servos PCA9685)
- `/robo_tirilo/ferramentas/rastreador_tela.py` — rastreador facial com câmera
- `/robo_tirilo/jogos/coreografia_seulobato/coreografia_seulobato.py`
- `/robo_tirilo/jogos/coreografia_macdonald/coreografia_macdonald.py`
- `/robo_tirilo/ferramentas/desligar_servos.py`

### 1. Fix de Drift nas Coreografias

O segundo ciclo das coreografias entrava adiantado porque `COMPASSOS_POR_CICLO = 9.5` era menor do que a música real. O erro acumulava a cada ciclo.

**Solução:**
- Ajustado para `COMPASSOS_POR_CICLO = 10.0`.
- Adicionado **bloco de Resync** no início de cada ciclo que calcula a deriva temporal e aplica `time.sleep()` para aguardar o beat exato.

### 2. Desligamento de Servos Pós-Coreografia

Ao fechar os olhos no final da performance, os servos de pálpebra permaneciam energizados, causando ruído e desgaste mecânico.

**Solução:** chamada de `ferramentas/desligar_servos.py` via `subprocess.run()` ao término do Gran Finale.

### 3. Reset de Olhos Pós-Jogo (tirilo.py)

Após coreografias, o robô ficava com olhos fechados/desviados sem recuperação automática.

**Solução:** `olhos.olhar_neutro(suave=True)` adicionado em `_executar_programa()` após `proc.wait()`.

### 4. Fix de Jitter ao Piscar com Rastreamento Ativo

**Causa raiz:** `_piscar_espontaneo()` chamava `olhos.olhar_neutro()` após cada piscada, resetando a posição dos olhos para H=50, V=50. O rastreador facial corrigia imediatamente para a posição do rosto — causando o tremor visível.

**Identificado por:** comparação direta com o arquivo `tirilopiscacerto.py` fornecido pelo usuário (versão antiga sem o bug).

**Correção:** removida a linha `olhos.olhar_neutro()` do loop de piscada espontânea.

### 5. Fix `mover_suave` — Sem Interferência no Rastreador

`mover_suave()` enviava comandos I2C para **todos** os eixos (olho H/V + pálpebras + sobrancelha) a cada passo do loop de interpolação, mesmo quando apenas as pálpebras eram solicitadas.

**Correção:** flags `atualizar_olho`, `atualizar_palpebra`, `atualizar_sb` — cada grupo de servos só recebe sinal se foi explicitamente passado como argumento.

### 6. Fix `rastreador_tela.py` — Piscada Assíncrona

A piscada espontânea usava `olhos.piscar()` síncrono, que bloqueava o loop da câmera por 100ms. Ao retornar, a câmera detectava nova posição e mandava salto brusco.

**Correção:** `threading.Thread(target=olhos.piscar_natural, daemon=True).start()`.

> **⚠️ Tentativas que pioraram o problema (registradas para referência):**
> - `self.piscando = True` pausando `olhar_para`: congelava o rastreamento durante 400ms após cada piscada.
> - Lock de arquivo OS (`fcntl.flock`) no I2C: overhead massivo no Raspberry Pi, derrubou FPS do rastreador drasticamente.

---

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

**Comportamento de segurança:**

| Situação | Comportamento |
|---|---|
| Perfil biométrico **não cadastrado** | Acesso **negado** → passa para a IA |
| Modelo ONNX **não instalado** | Acesso **permitido** (fail-open — problema de instalação) |
| Similaridade < 0.50 | Acesso **negado** → passa para a IA |
| Similaridade ≥ 0.50 | Acesso **permitido** → jogo executado |

> **Importante:** jogos protegidos por `{administrador}` ou `{terapeuta}` só funcionam após o perfil biométrico ser cadastrado com `biometria_setup_gui.py` ou `biometria_setup.py`.

**Flag de rastreamento facial:**

O campo `desativar_rastreamento` (BOOLEAN) na tabela `saas_jogos` permite desativar o rastreamento facial durante a execução de um jogo. Isso é essencial para coreografias como `coreografia_seulobato`, onde os olhos piscam conforme a música e o rastreamento interferiria nos movimentos.

Configure este campo pelo painel SaaS em **Gerenciar Aplicativos → Detalhes → "Desativar Rastreamento Facial durante o jogo"**.

**Servidor de voz UDP (porta 5050):**

O `tirilo.py` sobe um servidor UDP na porta 5050 que recebe pedidos de fala de subprogramas (jogos, ferramentas). O `parearcor.py` e demais jogos enviam o texto via UDP e o Tirilo fala usando o TTS configurado pela clínica (Piper/Edge/Espeak). Quando rodados standalone (sem o tirilo.py), o fallback é o espeak-ng local.
