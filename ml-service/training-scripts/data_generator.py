import pandas as pd
import numpy as np
import random

NUM_SAMPLES = 3000
OUTPUT_CSV_PATH = "synthetic_transport_data_v2.csv" # Novo nome para os dados

# --- Constantes para Estimativa de Tempo (horas) ---
VELOCIDADE_TERRESTRE_KMH = 80
VELOCIDADE_AEREO_COMERCIAL_KMH = 800
VELOCIDADE_AEREO_DEDICADO_KMH = 700
TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS = 3.0
TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS = 1.5

# Horários de "pico" para voos comerciais simulados (0-23h)
HORARIO_PICO_VOO_INICIO = 6 # 6 AM
HORARIO_PICO_VOO_FIM = 22   # 10 PM

def simular_tempo_deslocamento_terrestre_um_trecho_aeroporto():
    """Simula o tempo de deslocamento terrestre para UM trecho (hospital <> aeroporto)."""
    return random.uniform(0.5, 1.5) # Entre 30min e 1h30min

def calcular_tempo_total_estimado_para_modal(distancia_km_voo, modal, tempo_desloc_hosp_aeroporto_origem, tempo_desloc_hosp_aeroporto_destino):
    if modal == 0: # Terrestre (distancia_km_voo aqui é a distância total ponta a ponta)
        return distancia_km_voo / VELOCIDADE_TERRESTRE_KMH
    
    # Para modais aéreos, distancia_km_voo é a distância entre aeroportos
    tempo_voo_puro = 0
    tempo_solo_total = 0
    
    if modal == 1: # Aéreo Comercial
        tempo_voo_puro = distancia_km_voo / VELOCIDADE_AEREO_COMERCIAL_KMH
        tempo_solo_total = TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS
    elif modal == 2: # Aéreo Dedicado
        tempo_voo_puro = distancia_km_voo / VELOCIDADE_AEREO_DEDICADO_KMH
        tempo_solo_total = TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS
    else: # Modal desconhecido
        return float('inf')

    return tempo_desloc_hosp_aeroporto_origem + tempo_voo_puro + tempo_solo_total + tempo_desloc_hosp_aeroporto_destino

def gerar_dados():
    data = []
    print("Iniciando geração de dados sintéticos v2 (sem custos, com horário de voo)...")
    for i in range(NUM_SAMPLES):
        if i % 300 == 0:
            print(f"Gerando amostra {i} de {NUM_SAMPLES}...")

        # Feature 1: distancia_km (Distância total da viagem hospital a hospital - para terrestre)
        # Para aéreo, vamos assumir que esta é a distância entre aeroportos para simplificar,
        # e os trechos terrestres são adicionados.
        distancia_km_voo_ou_total = random.uniform(50, 4000) 
        
        # Feature 2: tempo_isquemia_max_horas
        tempo_isquemia_max_horas = random.choice([4, 6, 8, 12, 18, 24, 30, 36, 48])
        
        # Feature 3: urgencia_receptor
        urgencia_receptor = random.randint(1, 5)

        # Simular tempos de deslocamento terrestre para esta amostra
        tempo_hosp_aeroporto_origem = simular_tempo_deslocamento_terrestre_um_trecho_aeroporto()
        tempo_aeroporto_hosp_destino = simular_tempo_deslocamento_terrestre_um_trecho_aeroporto()

        # Feature 4: disponibilidade_voo_comercial_bool (ainda baseado em distância)
        disponibilidade_voo_comercial_bool = 0.0
        if distancia_km_voo_ou_total > 300 and random.random() > (0.2 if distancia_km_voo_ou_total < 1000 else 0.1):
            disponibilidade_voo_comercial_bool = 1.0
        
        # NOVA Feature 5: horario_compativel_voo_comercial_bool
        # Simula se o horário atual (aleatório) permite pegar um voo comercial.
        # Assumimos que o processo de retirada do órgão + deslocamento até aeroporto leva X horas.
        horario_atual_simulado = random.randint(0, 23) # Hora do dia
        tempo_preparacao_ate_decolagem_comercial = random.uniform(2, 4) # Tempo para retirar órgão, ir ao aeroporto, check-in
        horario_decolagem_estimado = (horario_atual_simulado + tempo_preparacao_ate_decolagem_comercial) % 24
        
        horario_compativel_voo_comercial_bool = 0.0
        if disponibilidade_voo_comercial_bool == 1.0:
            if HORARIO_PICO_VOO_INICIO <= horario_decolagem_estimado < HORARIO_PICO_VOO_FIM:
                horario_compativel_voo_comercial_bool = 1.0
            elif random.random() < 0.2: # Chance pequena fora do pico
                horario_compativel_voo_comercial_bool = 1.0
        
        # Feature 6: disponibilidade_voo_dedicado_bool (voos dedicados são mais flexíveis com horário)
        disponibilidade_voo_dedicado_bool = 0.0
        if (distancia_km_voo_ou_total > 150 and urgencia_receptor <= 2 and random.random() > 0.3) or \
           (distancia_km_voo_ou_total > 600 and disponibilidade_voo_comercial_bool == 0.0 and horario_compativel_voo_comercial_bool == 0.0 and random.random() > 0.2) or \
           (tempo_isquemia_max_horas <= 6 and distancia_km_voo_ou_total > 400 and random.random() > 0.25):
            disponibilidade_voo_dedicado_bool = 1.0
        
        # --- Lógica Heurística para Definir o "Melhor Modal" ---
        opcoes_validas = []

        # Avaliar Terrestre
        tempo_t = calcular_tempo_total_estimado_para_modal(distancia_km_voo_ou_total, 0, 0, 0)
        if tempo_t <= tempo_isquemia_max_horas:
            opcoes_validas.append({"modal": 0, "tempo": tempo_t})

        # Avaliar Aéreo Comercial
        if disponibilidade_voo_comercial_bool == 1.0 and horario_compativel_voo_comercial_bool == 1.0:
            tempo_ac = calcular_tempo_total_estimado_para_modal(distancia_km_voo_ou_total, 1, tempo_hosp_aeroporto_origem, tempo_aeroporto_hosp_destino)
            if tempo_ac <= tempo_isquemia_max_horas:
                opcoes_validas.append({"modal": 1, "tempo": tempo_ac})
        
        # Avaliar Aéreo Dedicado
        if disponibilidade_voo_dedicado_bool == 1.0: # Voo dedicado não depende de horário de pico
            tempo_ad = calcular_tempo_total_estimado_para_modal(distancia_km_voo_ou_total, 2, tempo_hosp_aeroporto_origem, tempo_aeroporto_hosp_destino)
            if tempo_ad <= tempo_isquemia_max_horas:
                opcoes_validas.append({"modal": 2, "tempo": tempo_ad})
        
        melhor_modal = -1 

        if not opcoes_validas:
            # Se nada viável, escolhe o mais rápido absoluto teoricamente
            modais_teoricos = []
            modais_teoricos.append({'modal': 0, 'tempo': calcular_tempo_total_estimado_para_modal(distancia_km_voo_ou_total, 0, 0, 0)})
            if disponibilidade_voo_comercial_bool: # Ignora horário para "mais rápido absoluto"
                 modais_teoricos.append({'modal': 1, 'tempo': calcular_tempo_total_estimado_para_modal(distancia_km_voo_ou_total, 1, tempo_hosp_aeroporto_origem, tempo_aeroporto_hosp_destino)})
            if disponibilidade_voo_dedicado_bool:
                 modais_teoricos.append({'modal': 2, 'tempo': calcular_tempo_total_estimado_para_modal(distancia_km_voo_ou_total, 2, tempo_hosp_aeroporto_origem, tempo_aeroporto_hosp_destino)})
            
            modais_teoricos.sort(key=lambda x: x["tempo"])
            if modais_teoricos:
                melhor_modal = modais_teoricos[0]["modal"]
            else: # Improvável
                melhor_modal = 0 
        else: 
            # Se há opções viáveis, prioriza por tempo
            opcoes_validas.sort(key=lambda x: x["tempo"])
            melhor_modal = opcoes_validas[0]["modal"]
            
            # Regra FORTE para evitar terrestre em longas distâncias se aéreo for opção
            if melhor_modal == 0 and distancia_km_voo_ou_total > 700:
                aereos_viaveis_mais_rapidos = [opt for opt in opcoes_validas if opt['modal'] in [1, 2] and opt['tempo'] < tempo_t * 0.75] # 25% mais rápido
                if aereos_viaveis_mais_rapidos:
                    aereos_viaveis_mais_rapidos.sort(key=lambda x: x['tempo'])
                    melhor_modal = aereos_viaveis_mais_rapidos[0]['modal']
                elif tempo_isquemia_max_horas <= 10 : # Se isquemia mais curta, e aéreo é só um pouco mais rápido, ainda prefira aéreo
                     aereos_viaveis_geral = [opt for opt in opcoes_validas if opt['modal'] in [1,2]]
                     if aereos_viaveis_geral:
                        aereos_viaveis_geral.sort(key=lambda x: x['tempo'])
                        melhor_modal = aereos_viaveis_geral[0]['modal']


        data.append([
            distancia_km_voo_ou_total, 
            tempo_isquemia_max_horas,
            urgencia_receptor,
            disponibilidade_voo_comercial_bool, # Feature 4
            horario_compativel_voo_comercial_bool, # Feature 5 (NOVA)
            disponibilidade_voo_dedicado_bool, # Feature 6
            # Custos removidos
            melhor_modal
        ])

    df = pd.DataFrame(data, columns=[
        "distancia_km", "tempo_isquemia_max_horas", "urgencia_receptor",
        "disponibilidade_voo_comercial_bool", 
        "horario_compativel_voo_comercial_bool", # NOVA FEATURE
        "disponibilidade_voo_dedicado_bool",
        "melhor_modal" # Target
    ])
    
    df.to_csv(OUTPUT_CSV_PATH, index=False)
    print(f"Dados sintéticos V2 gerados e salvos em {OUTPUT_CSV_PATH}")
    print(f"Distribuição dos modais (0:T, 1:AC, 2:AD):\n{df['melhor_modal'].value_counts(normalize=True).sort_index()}")

if __name__ == "__main__":
    gerar_dados()
