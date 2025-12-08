import os
import time
import threading
import subprocess
import asyncio
import random
import pyaudio
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

    def speak(self, text):
        if self.engine == 'edge_tts':
            if not self._speak_edge(text):
                print("Edge TTS failed, falling back to eSpeak.")
                self._speak_espeak(text)
        else:
            self._speak_espeak(text)

    def _speak_edge(self, text):
        """Generates audio using Edge TTS and plays it."""
        try:
            output_file = "/tmp/tts_output.mp3"
            # Using subprocess for edge-tts CLI might be safer for threading than asyncio in some contexts,
            # but let's try the library with asyncio.run()
            
            async def _gen():
                communicate = edge_tts.Communicate(text, self.voice, rate=self.rate, volume=self.volume)
                await communicate.save(output_file)

            asyncio.run(_gen())
            
            # Play audio using pygame mixer (already initialized in main.py usually, 
            # but we can re-init or check init here just in case).
            # Pygame handles MP3 software decoding nicely, avoiding mpg123 segfaults.
            import pygame
            if not pygame.mixer.get_init():
                pygame.mixer.init()
            
            # Se tiver device index, pygame usa o default do sistema (ALSA default).
            # Para forçar device no pygame é complexo, normalmente configura-se o ~/.asoundrc 
            # ou a variável de ambiente SDL_AUDIODRIVER/AUDIODEV antes do init.
            # Como a falha do mpg123 parece ser driver/codec, o pygame é uma boa tentativa.
            
            try:
                pygame.mixer.music.load(output_file)
                pygame.mixer.music.play()
                while pygame.mixer.music.get_busy():
                    pygame.time.Clock().tick(10)
                return True
            except Exception as e:
                print(f"Pygame playback error: {e}")
                # Fallback to pure mpg123 without arguments if pygame fails
                cmd = ["mpg123", output_file]
                subprocess.run(cmd, check=True)
                return True
        except Exception as e:
            print(f"Edge TTS error: {e}")
            return False

    def _speak_espeak(self, text):
        """Fallback using eSpeak."""
        try:
            # espeak-ng -v pt -w /tmp/out.wav "text" && aplay -D hw:X /tmp/out.wav
            # Or direct pipe.
            cmd = ["espeak-ng", "-v", "pt", text]
            # To route audio, it's easier to generate wav and play with aplay
            subprocess.run(cmd, check=False) # Simple fallback
            return True
        except Exception as e:
            print(f"eSpeak error: {e}")
            return False

class HardwareController:
    def __init__(self):
        self.audio_index = self.detect_usb_device_index()
        self.voice_manager = VoiceManager(self.audio_index)
        
        # GPIO Setup
        self.left_eye = None
        self.right_eye = None
        self.mouth_servo = None
        
        if GPIO_AVAILABLE:
            try:
                # Adjust pins as needed
                self.left_eye = LED(17)
                self.right_eye = LED(27)
                self.mouth_servo = AngularServo(18, min_angle=-90, max_angle=90)
            except Exception as e:
                print(f"GPIO Init Error: {e}")

        self.mouth_thread = None
        self.speaking = False

    def detect_usb_device_index(self):
        """Detects the index of the USB audio device."""
        p = pyaudio.PyAudio()
        usb_index = None
        print("Scanning audio devices...")
        for i in range(p.get_device_count()):
            info = p.get_device_info_by_index(i)
            name = info.get('name')
            print(f"Device {i}: {name}")
            if "USB" in name:
                usb_index = i
                # Keep searching? Usually the first one is fine.
                # But we might want the one that has output capabilities.
                if info.get('maxOutputChannels') > 0:
                    print(f"Found USB Audio Device at index {i}")
                    break
        
        p.terminate()
        return usb_index

    def update_config(self, config):
        self.voice_manager.set_config(config)

    def _animate_mouth(self):
        """Randomly moves the mouth servo while speaking."""
        while self.speaking:
            if self.mouth_servo:
                angle = random.uniform(-45, 45)
                self.mouth_servo.angle = angle
            time.sleep(0.15)
        
        # Reset
        if self.mouth_servo:
            self.mouth_servo.angle = 0

    def speak_animated(self, text):
        """Speaks text and moves mouth."""
        self.speaking = True
        self.mouth_thread = threading.Thread(target=self._animate_mouth)
        self.mouth_thread.start()
        
        self.voice_manager.speak(text)
        
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
                self.left_eye.off()
                self.right_eye.off()

if __name__ == "__main__":
    hw = HardwareController()
    print(f"Audio Index: {hw.audio_index}")
    # hw.speak_animated("Olá, eu sou o Tirilo.")
