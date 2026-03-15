
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Carrega variáveis do arquivo .env (se existir localmente)
load_dotenv()

# Tenta ler com prefixo NEXT_PUBLIC (padrão web) ou sem (padrão python)
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
# Usamos a ANON KEY pois o robô atua como um 'cliente' autenticado (futuramente via login) ou device público.
# Se precisar de privilégios de admin, usar a SERVICE_ROLE_KEY, mas com cautela para segurança do device.
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("ERRO CRÍTICO: Variáveis de ambiente Supabase não encontradas.")
    # Não vamos dar raise erro aqui para não travar o boot de outros jogos que não usam rede, 
    # mas o diario.py vai falhar.
    supabase: Client = None
else:
    try:
        supabase: Client = create_client(url, key)
        print("Supabase Client conectado.")
    except Exception as e:
        print(f"Erro ao conectar Supabase: {e}")
        supabase = None
