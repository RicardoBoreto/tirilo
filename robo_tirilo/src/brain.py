import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class BrainManager:
    def __init__(self):
        self.api_key = os.environ.get("GOOGLE_GEMINI_API_KEY")
        if not self.api_key:
            print("Warning: GOOGLE_GEMINI_API_KEY not found.")
        else:
            genai.configure(api_key=self.api_key)
        
        self.model_name = 'gemini-2.5-flash' # Updated per user request
        self.model = None
        self.chat_session = None
        self.system_instruction = "Você é o Tirilo, um robô amigo e terapêutico."

    def configure(self, config):
        """Configures the model with personality and settings."""
        if 'prompt_personalidade_robo' in config:
            self.system_instruction = config['prompt_personalidade_robo']
        
        # Try to use requested model or fallback
        # self.model_name = config.get('modelo', 'gemini-2.5-flash') 
        
        try:
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=self.system_instruction
            )
            self.chat_session = self.model.start_chat(history=[])
            print(f"Brain configured with model {self.model_name}")
        except Exception as e:
            print(f"Error configuring brain: {e}")

    def process_input(self, text):
        """Sends text to Gemini and returns the response."""
        if not self.chat_session:
            return "Erro: Cérebro não inicializado."
        
        try:
            response = self.chat_session.send_message(text)
            return response.text
        except Exception as e:
            print(f"Brain error: {e}")
            return "Desculpe, tive um problema para pensar agora."

if __name__ == "__main__":
    brain = BrainManager()
    brain.configure({'prompt_personalidade_robo': 'Você é um assistente útil.'})
    # print(brain.process_input("Olá"))
