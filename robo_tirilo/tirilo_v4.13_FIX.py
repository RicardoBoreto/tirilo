#!/usr/bin/env python3
"""
=============================================================================
PROJETO: ROBÔ TIRILO
ARQUIVO: tirilo.py
VERSÃO:  4.13 (FIX TREMEDEIRA + BIOMETRIA + VOZ ESTÁVEL)
DATA:    04/04/2026
AUTOR:   Ricardo Alonso Boreto

MUDANÇAS v4.13:
- Fix Sincronização: Adicionado _ev_camera_livre.clear() no loop de visão.
- Restauração de Voz: Recuperada a lógica Piper/Edge-TTS do tiriloAnt.py.
- Biometria Integrada: Mantida a proteção de segurança para comandos sensíveis.
- Silêncio I2C: Garantia de pausa total de threads antes de coreografias.

=============================================================================
"""

import os
import sys
import math
import re
import threading
import time
import subprocess
import random
import pygame
import queue
import speech_recognition as sr
import socket
import numpy as np
import wave
from dotenv import load_dotenv
import asyncio
import edge_tts
from google import genai
from google.genai import types
import cv2

# --- BIOMETRIA (v4.13) ---
try:
    import librosa
    from scipy.spatial.distance import cosine
    BIOMETRIA_LIBS_OK = True
except ImportError:
    BIOMETRIA_LIBS_OK = False

try:
    from piper.voice import PiperVoice
except ImportError:
    PiperVoice = None

from olhos_tirilo import ControladorOlhos
from src.cloud import CloudManager

# --- 1. CONFIGURAÇÕES GLOBAIS ---
NOME_ROBO = "Tirilo"
VERSAO_ATUAL = "4.13"
AUTOR = "Ricardo Alonso Boreto"

# EMEET Office Core M1A (E1102)
DISPOSITIVO_AUDIO = "plughw:CARD=M1A,DEV=0"
TAXA_CAPTURA      = 48000 

# --- BIOMETRIA CONSTANTES ---
MODELO_VOZ_ADMIN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "modelo_voz_admin.npy")
LIMIAR_SIMILARIDADE_ADMIN = 0.50 
_BIOMETRIA_MODELO = None

# --- Configuração Piper ---
_PIPER_INSTANCIA = None
PASTA_VOZES_PIPER = os.path.expanduser("~/projeto_robo/robo_tirilo/vozes_piper")
PIPER_VELOCIDADE = 1.4
PIPER_PITCH = 150

def _buscar_modelo_piper():
    if not os.path.exists(PASTA_VOZES_PIPER):
        os.makedirs(PASTA_VOZES_PIPER, exist_ok=True)
    modelos = [f for f in os.listdir(PASTA_VOZES_PIPER) if f.endswith(".onnx")]
    return os.path.join(PASTA_VOZES_PIPER, modelos[0]) if modelos else None

CAMINHO_MODELO_PIPER = _buscar_modelo_piper()

def _inicializar_piper():
    global _PIPER_INSTANCIA, CAMINHO_MODELO_PIPER
    if not PiperVoice: return
    if not CAMINHO_MODELO_PIPER: CAMINHO_MODELO_PIPER = _buscar_modelo_piper()
    if CAMINHO_MODELO_PIPER and os.path.exists(CAMINHO_MODELO_PIPER):
        try:
            _PIPER_INSTANCIA = PiperVoice.load(CAMINHO_MODELO_PIPER, config_path=CAMINHO_MODELO_PIPER + ".json", use_cuda=False)
            _PIPER_INSTANCIA.config.length_scale = PIPER_VELOCIDADE
        except: pass

# --- SINCRONIZAÇÃO ---
MODO_VISAO_ATIVO = True
_ev_camera_livre = threading.Event()
_pausar_piscar = False
TEXTO_RESPOSTA_IA = ""

# --- VISÃO v4.13 ---
class VisaoThread(threading.Thread):
    def __init__(self, controlador_olhos):
        super().__init__(); self.olhos = controlador_olhos; self.running = True; self.daemon = True
        self.cap = None; self.last_x, self.last_y = 50.0, 50.0; self.alpha = 0.15

    def run(self):
        if not self.olhos: return
        face_csc = cv2.CascadeClassifier(os.path.join(os.path.dirname(__file__), "haarcascades", "haarcascade_frontalface_default.xml"))
        while self.running:
            if not MODO_VISAO_ATIVO:
                if self.cap:
                    self.cap.release(); self.cap = None
                    _ev_camera_livre.set()
                time.sleep(0.3); continue
            
            _ev_camera_livre.clear() 
            if self.cap is None:
                self.cap = cv2.VideoCapture(0)
                if not self.cap.isOpened(): time.sleep(1); continue
            
            ret, frame = self.cap.read()
            if ret:
                gray = cv2.cvtColor(cv2.resize(frame, (320, 240)), cv2.COLOR_BGR2GRAY)
                faces = face_csc.detectMultiScale(gray, 1.1, 4)
                if len(faces) > 0:
                    m = max(faces, key=lambda f: f[2]*f[3])
                    alvo_x = 100 - ((m[0]+m[2]//2)*2 / 640 * 100)
                    alvo_y = ((m[1]+m[3]//2)*2 / 480 * 100)
                    self.last_x = (alvo_x * self.alpha) + (self.last_x * (1.0 - self.alpha))
                    self.last_y = (alvo_y * self.alpha) + (self.last_y * (1.0 - self.alpha))
                    if not _pausar_piscar: self.olhos.olhar_para(self.last_x, self.last_y)
            time.sleep(1.0/15)

def falar(texto):
    if not texto: return
    subprocess.run(["espeak-ng", "-v", "pt-br", "-s", "140", texto, "--stdout", "|", "aplay", "-D", DISPOSITIVO_AUDIO, "-q"], shell=True)

def _executar_programa_bio(nome):
    global _pausar_piscar, MODO_VISAO_ATIVO
    v_ativa = MODO_VISAO_ATIVO
    if v_ativa:
        MODO_VISAO_ATIVO = False
        _ev_camera_livre.wait(timeout=3)
    _pausar_piscar = True
    subprocess.run(["python3", os.path.join(os.path.dirname(__file__), nome)])
    _pausar_piscar = False; MODO_VISAO_ATIVO = v_ativa
