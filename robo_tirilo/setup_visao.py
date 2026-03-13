import os
import time
import urllib.request
from zipfile import ZipFile

# Diretório para salvar as cascatas
HAAR_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "haarcascades")

def baixar_haarcascades():
    if not os.path.exists(HAAR_DIR):
        print("Criando diretório para os modelos Haar Cascade...")
        os.makedirs(HAAR_DIR)
        
    url_frontalface = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
    caminho_frontalface = os.path.join(HAAR_DIR, "haarcascade_frontalface_default.xml")
    
    if not os.path.exists(caminho_frontalface):
        print(f"Baixando {url_frontalface}...")
        try:
            urllib.request.urlretrieve(url_frontalface, caminho_frontalface)
            print("Download concluído com sucesso.")
        except Exception as e:
            print(f"Erro ao baixar o modelo: {e}")
            return False
    else:
        print("Modelo Haar Cascade já existe localmente.")
    
    return True

if __name__ == "__main__":
    baixar_haarcascades()
