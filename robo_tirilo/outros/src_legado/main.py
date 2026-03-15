import time
import queue
import threading
from cloud import CloudManager
from hardware import HardwareController
from brain import BrainManager
from gui import GuiManager
from game_manager import GameManager

def main():
    # 1. Initialize Modules
    print("Initializing Tirilo...")
    cloud = CloudManager()
    hardware = HardwareController()
    brain = BrainManager()
    gui = GuiManager()
    game_manager = GameManager(hardware, gui, brain)
    
    # Pre-load games
    game_manager.load_games()
    
    command_queue = queue.Queue()

    # 2. Cloud Setup & Security Check
    try:
        is_blocked = cloud.check_status()
        if is_blocked:
            print("System Blocked.")
            gui.set_state("LOCKED")
        else:
            print("System Active.")
            gui.set_state("IDLE")
            
            # Fetch Config
            config = cloud.get_config()
            hardware.update_config(config)
            brain.configure(config)
            
            # Setup Cloud Callbacks
            def on_cloud_command(cmd):
                command_queue.put(cmd)
            
            cloud.register_callback(on_cloud_command)
            cloud.start_listener()
            
            # Initial Greeting
            # Use unicode escape for reliability: Ol\u00e1
            hardware.speak_animated("Ol\u00e1, eu sou o Tirilo. Vamos brincar?", ui_callback=None)
            
    except Exception as e:
        print(f"Initialization Error: {e}")
    
    # 3. Main Loop
    running = True
    while running:
        # Handle GUI Events (Global)
        events = gui.get_events()
        action = gui.process_events(events)
        
        if action == "QUIT":
            running = False
        
        # Pass raw events to active game (for drag & drop)
        if game_manager.current_game:
            for event in events:
                game_manager.handle_pygame_event(event)
            
        # Handle Cloud Commands
        try:
            while not command_queue.empty():
                cmd = command_queue.get_nowait()
                print(f"Processing command: {cmd}")
                payload = cmd.get('comando', '')
                
                if payload == "PARAR":
                    if game_manager.current_game:
                        game_manager.stop_current_game()
                    else:
                        hardware.speak_animated("Já estou parado.", ui_callback=gui.draw)
                    gui.set_state("IDLE")
                    
                elif payload == "MODO_PAPAGAIO":
                    game_manager.start_game("papagaio")
                    
                elif payload == "MODO_CONVERSA":
                    game_manager.start_game("conversa")
                    
                elif payload == "JOGO_PAREAR":
                    if game_manager.current_game and "Parear" in game_manager.current_game.nome:
                        hardware.speak_animated("O jogo já está rodando.", ui_callback=gui.draw)
                    elif not game_manager.start_game("parear_cor"):
                        hardware.speak_animated("Jogo parear não encontrado.", ui_callback=gui.draw)
                        
                elif payload == "JOGO_CORES" or payload == "JOGAR_CORES":
                    # Mapeando explicitamente para o jogo de parear cores se solicitado
                    # ou se o usuário confunde os nomes. O usuário sugeriu parear_cor.
                    if not game_manager.start_game("parear_cor"):
                         hardware.speak_animated("Jogo parear não encontrado.", ui_callback=gui.draw)
                         
                elif payload == "FALAR":
                    text = cmd.get('parametros', {}).get('texto', '')
                    if text:
                        if game_manager.current_game:
                             game_manager.stop_current_game()
                        # State update handled in main loop now
                        hardware.speak_animated(text, ui_callback=None)

                elif payload == "PING":
                    from datetime import datetime, timezone
                    print("Received PING, sending PONG...")
                    cloud.send_telemetry('SYSTEM', 'PONG', datetime.now(timezone.utc).isoformat())

        except queue.Empty:
            pass

        # Game Loop / Logic
        if game_manager.current_game:
            if game_manager.current_game.running:
                # O jogo roda sua lógica (pode ser bloqueante se mal feito, 
                # mas nossos plugins usam hardware.listen com timeout curto ou controlados)
                # O ideal seria on_voice controlado pelo main, mas para portar a logica antiga:
                game_manager.handle_input('loop', None)
            else:
                # Jogo terminou sozinho (ex: falou "sair")
                game_manager.stop_current_game()
                gui.set_state("IDLE")
        
        # Draw GUI
        # Se o jogo estiver rodando, ele pode ter desenhado algo no loop? 
        # Nossos plugins atuais chamam gui.draw() explicitamente nas animações.
        # Mas o estado IDLE precisa ser desenhado aqui.
        if not game_manager.current_game:
             # AUTO-SYNC: Update face state based on hardware status
             if hardware.speaking:
                 gui.set_state("TALKING")
             elif gui.state == "TALKING":
                 gui.set_state("IDLE")
                 
             gui.draw()
        
        # Check if GUI closed
        if not gui.running:
            running = False

    # Cleanup
    print("Shutting down...")
    cloud.stop()
    gui.quit()

if __name__ == "__main__":
    main()
