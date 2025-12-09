import os
import time
import threading
import subprocess
import asyncio
import random
import pyaudio
import re
# from gpiozero import LED, AngularServo # Commented out for dev environment without GPIO
# Mocking GPIO for development if libraries are missing or not on RPi
try:
    from gpiozero import LED, AngularServo
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False
    print("GPIO libraries not found. Running in mock mode.")

import edge_tts

class VoiceManager:
    def __init__(self, device_index=None):
        self.device_index = device_index
        self.engine = 'edge_tts' # Default
        self.voice = 'pt-BR-AntonioNeural' # Default edge voice
        self.rate = '+0%'
        self.volume = '+0%'

    def set_config(self, config):
        self.engine = config.get('motor_voz_preferencial', 'edge_tts')

    def speak(self, text, wait_callback=None):
        if self.engine == 'edge_tts':
            if not self._speak_edge(text, wait_callback):
                print("Edge TTS failed, falling back to eSpeak.")
                self._speak_espeak(text, wait_callback)
        else:
            self._speak_espeak(text, wait_callback)

    def stop(self):
        """Stops any currently playing audio."""
        try:
            import pygame
            if pygame.mixer.get_init():
                pygame.mixer.music.stop()
        except:
            pass
            
        # If we had a wrapper for espeak process, we should kill it here.
        # But we didn't store the process in self.
        # For now, pygame stop covers EdgeTTS. ESpeak is short usually.

    def _speak_edge(self, text, wait_callback=None):
        """Generates audio using Edge TTS and plays it (Cached logic like parearcor.py)."""
        try:
            # Use local cache directory to prevent file locking and network spam
            temp_dir = os.path.join(os.getcwd(), "temp_audio")
            os.makedirs(temp_dir, exist_ok=True)
            
            # Hash text to create unique filename
            filename = f"audio_{abs(hash(text))}.mp3"
            output_file = os.path.join(temp_dir, filename)
            
            # Generate only if file doesn't exist
            if not os.path.exists(output_file):
                async def _gen():
                    # Simplified call matching parearcor.py (no rate/volume params)
                    communicate = edge_tts.Communicate(text, self.voice)
                    await communicate.save(output_file)

                asyncio.run(_gen())
            
            import pygame
            if not pygame.mixer.get_init():
                pygame.mixer.init()
            
            try:
                pygame.mixer.music.load(output_file)
                pygame.mixer.music.play()
                while pygame.mixer.music.get_busy():
                    if wait_callback:
                        wait_callback()
                    time.sleep(0.05)
                
                return True
            except Exception as e:
                print(f"Pygame playback error: {e}")
                return False
                
        except Exception as e:
            print(f"Edge TTS error: {e}")
            return False

    def _speak_espeak(self, text, wait_callback=None):
        """Fallback using eSpeak."""
        try:
            cmd = ["espeak-ng", "-v", "pt", text]
            # Force UTF-8 environment for subprocess to ensure accents are handled
            env = os.environ.copy()
            env["LANG"] = "pt_BR.UTF-8"
            env["LC_ALL"] = "pt_BR.UTF-8"
            process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
            while process.poll() is None:
                if wait_callback:
                    wait_callback()
                time.sleep(0.03)
            return True
        except Exception as e:
            print(f"eSpeak error: {e}")
            return False

# ... HardwareController class ...

    def stop_speaking(self):
        """Stops current speech and animation."""
        self.speaking = False # Signals mouth thread to stop
        self.voice_manager.stop() # Stops audio
        # We don't join threads here to avoid deadlocks, they will exit naturally

    def speak_animated(self, text, ui_callback=None, blocking=False):
        """Speaks text and moves mouth. Default is threaded (non-blocking)."""
        self.stop_speaking() # Stop previous
        
        # Clean text
        clean_text = str(text).replace('*', '').replace('#', '')
        clean_text = re.sub(r'[\U00010000-\U0010ffff]', '', clean_text)
        
        if blocking:
            self._run_speak_job(clean_text, ui_callback)
        else:
            t = threading.Thread(target=self._run_speak_job, args=(clean_text, ui_callback))
            t.start()
            
    def _run_speak_job(self, text, ui_callback):
        self.speaking = True
        
        # Start mouth animation in parallel to audio wait
        self.mouth_thread = threading.Thread(target=self._animate_mouth)
        self.mouth_thread.start()
        
        self.voice_manager.speak(text, wait_callback=ui_callback)
        
        self.speaking = False
        if self.mouth_thread:
            self.mouth_thread.join()

class HardwareController:
    def __init__(self):
        self.device_indices = self.detect_usb_device_index()
        self.output_index = self.device_indices.get('output')
        self.input_index = self.device_indices.get('input')
        
        # Use output index for VoiceManager if needed (VoiceManager currently uses default/pygame logic but could be updated)
        self.voice_manager = VoiceManager(self.output_index)
        
        # GPIO Setup
        self.left_eye = None
        self.right_eye = None
        self.mouth_servo = None
        
        if GPIO_AVAILABLE:
            try:
                # Adjust pins as needed
                # Pinos corrigidos conforme tiriloV324.py
                self.left_eye = LED(24)
                self.right_eye = LED(23)
                self.mouth_servo = AngularServo(18, min_angle=-90, max_angle=90)
            except Exception as e:
                print(f"GPIO Init Error: {e}")

        self.mouth_thread = None
        self.speaking = False

    def detect_usb_device_index(self):
        """Detects the index of the USB audio device (both input and output)."""
        p = pyaudio.PyAudio()
        usb_output = None
        usb_input = None
        
        print("\n=== Audio Device Scan ===")
        for i in range(p.get_device_count()):
            info = p.get_device_info_by_index(i)
            name = info.get('name')
            in_ch = info.get('maxInputChannels')
            out_ch = info.get('maxOutputChannels')
            print(f"[{i}] {name} | In: {in_ch} | Out: {out_ch}")
            
            if "USB" in name:
                # Prefer devices with correct capabilities
                if out_ch > 0 and usb_output is None:
                    usb_output = i
                
                if in_ch > 0 and usb_input is None:
                    usb_input = i
        print(f"=== Selected USB Input: {usb_input}, Output: {usb_output} ===\n")
        
        p.terminate()
        return {'output': usb_output, 'input': usb_input}

    def update_config(self, config):
        self.voice_manager.set_config(config)

    def _animate_mouth(self):
        """Randomly moves the mouth servo while speaking."""
        while self.speaking:
            if self.mouth_servo:
                try:
                    # Simpler Open/Close animation which is more visible
                    target = random.choice([-45, 0, 45, 0]) 
                    self.mouth_servo.angle = target
                except Exception as e:
                    print(f"Servo Error: {e}")
            time.sleep(0.15)
        
        # Reset
        if self.mouth_servo:
            try:
                self.mouth_servo.angle = 0
            except:
                pass

    def stop_speaking(self):
        """Stops current speech and animation."""
        self.speaking = False # Signals mouth thread to stop
        self.voice_manager.stop() # Stops audio
        # We don't join threads here to avoid deadlocks, they will exit naturally

    def speak_animated(self, text, ui_callback=None, blocking=False):
        """Speaks text and moves mouth. Default is threaded (non-blocking)."""
        self.stop_speaking() # Stop previous
        
        # Clean text
        clean_text = str(text).replace('*', '').replace('#', '')
        # clean_text = re.sub(r'[\U00010000-\U0010ffff]', '', clean_text) # Comentado por suspeita de remover acentos
        print(f"DEBUG SENT TO TTS: '{clean_text}'")
        
        if blocking:
            self._run_speak_job(clean_text, ui_callback)
        else:
            t = threading.Thread(target=self._run_speak_job, args=(clean_text, ui_callback))
            t.start()
            
    def _run_speak_job(self, text, ui_callback):
        self.speaking = True
        
        # Start mouth animation in parallel to audio wait
        self.mouth_thread = threading.Thread(target=self._animate_mouth)
        self.mouth_thread.start()
        
        self.voice_manager.speak(text, wait_callback=ui_callback)
        
        self.speaking = False
        if self.mouth_thread:
            self.mouth_thread.join()

    def set_eyes(self, state):
        """Control eyes (True=On, False=Off)."""
        if self.left_eye and self.right_eye:
            if state:
                self.left_eye.on()
                self.right_eye.on()
            else:
                self.right_eye.off()
            
    def listen(self, timeout=None):
        """Listens for audio input using arecord (ALSA) and returns recognized text."""
        # Using arecord directly as requested/inspired by tiriloV324.py
        # This bypasses PyAudio device enumeration issues on some Raspbian configs
        
        # Use a local file to avoid permission issues in /tmp if previously created by another user (e.g. root)
        output_file = "voz_usuario.wav"
        
        # Determine device string. If we found a USB input at index X, 
        # ALSA usually maps it to card X (plughw:X,0).
        # Fallback to plughw:1,0 or plughw:0,0 if detection fails.
        
        device_str = "plughw:0,0" # Default fallback
        if self.input_index is not None:
             device_str = f"plughw:{self.input_index},0"
        
        print(f"Listening with arecord on {device_str}...")
        
        try:
            # Capture 5 seconds of audio (timeout mimic) or until silence (hard with raw arecord)
            # tiriloV324.py uses fixed duration "-d 4". Let's use that for stability.
            recording_duration = "4" 
            
            cmd = ["arecord", "-D", device_str, "-d", recording_duration, "-f", "cd", "-q", "-r", "16000", output_file]
            
            # Run arecord
            subprocess.run(cmd, check=True)
            
            if os.path.exists(output_file):
                print("Processing audio...")
                import speech_recognition as sr
                r = sr.Recognizer()
                
                with sr.AudioFile(output_file) as source:
                    audio = r.record(source)
                
                # Recognize
                try:
                    text = r.recognize_google(audio, language="pt-BR")
                    print(f"Heard: {text}")
                    return text
                except sr.UnknownValueError:
                    return None
                except sr.RequestError as e:
                    print(f"API Error: {e}")
                    return None
            else:
                print("Audio file not generated.")
                return None
                
        except subprocess.CalledProcessError as e:
            print(f"arecord failed: {e}")
            return None
        except Exception as e:
            print(f"Listen Error: {e}")
            return None

if __name__ == "__main__":
    hw = HardwareController()
    print(f"Audio Index: {hw.audio_index}")
    # hw.speak_animated("Olá, eu sou o Tirilo.")
