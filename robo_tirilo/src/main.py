import time
import queue
import threading
from cloud import CloudManager
from hardware import HardwareController
from brain import BrainManager
from gui import GuiManager

def main():
    # 1. Initialize Modules
    print("Initializing Tirilo...")
    cloud = CloudManager()
    hardware = HardwareController()
    brain = BrainManager()
    gui = GuiManager()
    
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
            hardware.speak_animated("Olá, eu sou o Tirilo. Vamos brincar?")
            
    except Exception as e:
        print(f"Initialization Error: {e}")
        # Continue to GUI to show error or default state if possible
    
    # 3. Main Loop
    running = True
    while running:
        # Handle GUI Events
        action = gui.handle_events()
        if action == "QUIT":
            running = False
        elif action and action.startswith("GAME_"):
            game_id = action.split("_")[1]
            print(f"Starting Game: {game_id}")
            gui.set_state("TALKING") # Or specific game state
            hardware.speak_animated(f"Você escolheu o jogo de {game_id}")
            # Logic to start game...
            # For now, just simulate a session
            cloud.send_telemetry(game_id, "INICIO", time.time())
            gui.set_state("IDLE")

        # Handle Cloud Commands
        try:
            while not command_queue.empty():
                cmd = command_queue.get_nowait()
                print(f"Processing command: {cmd}")
                payload = cmd.get('comando', '') # Assuming 'comando' column
                
                if payload == "PARAR":
                    gui.set_state("IDLE")
                    hardware.speak_animated("Parando atividades.")
                elif payload == "JOGO_CORES":
                    gui.set_state("GAME_SELECTION") # Or direct to game
                    hardware.speak_animated("Vamos jogar o jogo das cores!")
                elif payload == "FALAR":
                    text = cmd.get('parametros', {}).get('texto', '')
                    if text:
                        gui.set_state("TALKING")
                        hardware.speak_animated(text)
                        gui.set_state("IDLE")
                        
        except queue.Empty:
            pass

        # Draw GUI
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
