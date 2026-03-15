#!/usr/bin/env python3
import os
import sys
from src.cloud import CloudManager

def testar():
    print("=== TESTE DE DIRETRIZES SUPABASE ===")
    try:
        cm = CloudManager()
        print(f"1. Identificação: MAC {cm.mac_address}")
        print(f"   - URL encontrada: {cm.url[:25]}...")
        print(f"   - KEY encontrada: {cm.key[:15]}...")
        
        # Tenta descobrir o ID da clínica
        bloqueado = cm.check_status()
        print(f"2. Clínica ID: {cm.clinica_id} (Bloqueado: {bloqueado})")
        
        # Teste de busca de diretrizes
        for modo in ["CRIANCA", "TERAPEUTA"]:
            print(f"\nBuscando diretriz para {modo}...")
            diretriz = cm.get_ai_directive(modo)
            if diretriz:
                print(f"Sucesso! (Início: {diretriz[:50]}...)")
            else:
                print("Aviso: Nenhuma diretriz encontrada online ou no cache.")
        
        print("\n3. Verificando Cache Local...")
        if os.path.exists(cm.cache_file):
            print(f"Arquivo de cache encontrado em: {cm.cache_file}")
        else:
            print("Cache local ainda não foi criado.")
            
    except Exception as e:
        print(f"\nERRO CRÍTICO NO TESTE: {e}")
        print("Certifique-se de que as chaves SUPABASE_URL e SUPABASE_KEY estão no seu .env")

if __name__ == "__main__":
    testar()
