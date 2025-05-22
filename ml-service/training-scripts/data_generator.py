# ml-service/training_scripts/data_generator.py

import pandas as pd
import numpy as np
import random

NUM_SAMPLES = 5000
OUTPUT_CSV_PATH = "synthetic_transport_data_v5.csv"

# Constantes
VELOCIDADE_TERRESTRE_KMH = 80
VELOCIDADE_AEREO_COMERCIAL_KMH = 800
VELOCIDADE_AEREO_DEDICADO_KMH = 700
TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS = 1.0 
TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS = 0.75
HORARIO_PICO_VOO_INICIO = 6
HORARIO_PICO_VOO_FIM = 22

def simular_tempo_deslocamento_terrestre_um_trecho_aeroporto():
    return random.uniform(0.3, 0.8) # Tempo de 18 a 48 minutos por trecho

def calcular_tempo_total_estimado_para_modal(distancia_km_voo_ou_total, modal, t_hosp_aero_orig, t_aero_hosp_dest):
    if modal == 0: 
        return distancia_km_voo_ou_total / VELOCIDADE_TERRESTRE_KMH
    
    tempo_voo_puro = 0
    tempo_solo_total = 0
    
    if modal == 1: 
        tempo_voo_puro = distancia_km_voo_ou_total / VELOCIDADE_AEREO_COMERCIAL_KMH
        tempo_solo_total = TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS
    elif modal == 2: 
        tempo_voo_puro = distancia_km_voo_ou_total / VELOCIDADE_AEREO_DEDICADO_KMH
        tempo_solo_total = TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS
    else: 
        return float('inf')

    return t_hosp_aero_orig + tempo_voo_puro + tempo_solo_total + t_aero_hosp_dest

def gerar_dados():
    data = []
    print("Iniciando geração de dados sintéticos v5 (prioridade TEMPO EXPLÍCITA)...")
    count_modals = {0:0, 1:0, 2:0}

    for i in range(NUM_SAMPLES):
        distancia_km = random.uniform(50, 4000) 
        tempo_isquemia_max_horas = random.choice([4, 6, 8, 10, 12, 15, 18, 24, 30, 36, 48])
        urgencia_receptor = random.randint(1, 5)
        t_hosp_aero_orig = simular_tempo_deslocamento_terrestre_um_trecho_aeroporto()
        t_aero_hosp_dest = simular_tempo_deslocamento_terrestre_um_trecho_aeroporto()

        # Voo Comercial - Disponibilidade e Horário
        disp_com_bool = 0.0
        if distancia_km > 250 and random.random() > (0.25 if distancia_km < 1000 else 0.15): 
            disp_com_bool = 1.0
        
        horario_atual_sim = random.randint(0, 23)
        tempo_prep_decol_com = random.uniform(1.5, 3.0) 
        horario_decol_est_com = (horario_atual_sim + tempo_prep_decol_com) % 24
        horario_comp_com_bool = 0.0
        if disp_com_bool == 1.0:
            if HORARIO_PICO_VOO_INICIO <= horario_decol_est_com < HORARIO_PICO_VOO_FIM:
                horario_comp_com_bool = 1.0
            elif random.random() < 0.10:
                horario_comp_com_bool = 1.0
        
        # Voo Dedicado - Disponibilidade
        disp_ded_bool = 0.0
        chance_ded = 0.05
        if distancia_km > 400: chance_ded += 0.15
        if distancia_km > 1200: chance_ded += 0.20
        if urgencia_receptor <= 2: chance_ded += 0.25
        if tempo_isquemia_max_horas <= 8: chance_ded += 0.20
        if (disp_com_bool == 0.0 or horario_comp_com_bool == 0.0) and \
           (distancia_km > 500 or tempo_isquemia_max_horas <= 12):
            chance_ded += 0.35
        if random.random() < min(chance_ded, 0.90):
            disp_ded_bool = 1.0
        opcoes = []
        
        # Terrestre
        tempo_t = calcular_tempo_total_estimado_para_modal(distancia_km, 0, 0, 0)
        opcoes.append({"modal": 0, "tempo": tempo_t, "isquemia_ok": tempo_t <= tempo_isquemia_max_horas, "prioridade": 3, "disponivel": True})

        # Aéreo Comercial
        tempo_ac = float('inf')
        isquemia_ok_ac = False
        disponivel_ac = disp_com_bool == 1.0 and horario_comp_com_bool == 1.0
        if disponivel_ac:
            tempo_ac = calcular_tempo_total_estimado_para_modal(distancia_km, 1, t_hosp_aero_orig, t_aero_hosp_dest)
            isquemia_ok_ac = tempo_ac <= tempo_isquemia_max_horas
        opcoes.append({"modal": 1, "tempo": tempo_ac, "isquemia_ok": isquemia_ok_ac, "prioridade": 1, "disponivel": disponivel_ac})

        # Aéreo Dedicado
        tempo_ad = float('inf')
        isquemia_ok_ad = False
        disponivel_ad = disp_ded_bool == 1.0
        if disponivel_ad:
            tempo_ad = calcular_tempo_total_estimado_para_modal(distancia_km, 2, t_hosp_aero_orig, t_aero_hosp_dest)
            isquemia_ok_ad = tempo_ad <= tempo_isquemia_max_horas
        opcoes.append({"modal": 2, "tempo": tempo_ad, "isquemia_ok": isquemia_ok_ad, "prioridade": 2, "disponivel": disponivel_ad})
        
        # Filtrar apenas opções VIÁVEIS DENTRO DA ISQUEMIA
        opcoes_viaveis = [opt for opt in opcoes if opt["isquemia_ok"]]

        melhor_modal = -1

        if not opcoes_viaveis:
            # Nenhuma opção DENTRO da isquemia. Escolhe o mais rápido absoluto entre os DISPONÍVEIS.
            opcoes_disponiveis_apenas = [opt for opt in opcoes if opt["disponivel"]]
            if opcoes_disponiveis_apenas:
                opcoes_disponiveis_apenas.sort(key=lambda x: (x["tempo"], x["prioridade"]))
                melhor_modal = opcoes_disponiveis_apenas[0]["modal"]
            else: 
                melhor_modal = 0
        else:
            # Há opções viáveis. PRIORIDADE MÁXIMA: MENOR TEMPO.
            # Critério de desempate: prioridade intrínseca.
            opcoes_viaveis.sort(key=lambda x: (x["tempo"], x["prioridade"]))
            melhor_modal_candidato = opcoes_viaveis[0]["modal"]
            
            # Regra para evitar terrestre em longas distâncias (>750km)
            # se uma opção aérea for viável e não *muito* mais lenta.
            if melhor_modal_candidato == 0 and distancia_km > 750:
                tempo_terrestre_escolhido = opcoes_viaveis[0]["tempo"]
                aereos_alternativos_viaveis = [opt for opt in opcoes_viaveis if opt['modal'] in [1, 2]]
                
                if aereos_alternativos_viaveis:
                    aereos_alternativos_viaveis.sort(key=lambda x: (x["tempo"], x["prioridade"]))
                    melhor_aereo_alternativo = aereos_alternativos_viaveis[0]
                    
                    # Prefere aéreo se:
                    # 1. For mais rápido que terrestre.
                    # 2. Ou não for muito mais lento (ex: até 1 hora a mais) E (isquemia < 18h OU urgencia <=2)
                    if (melhor_aereo_alternativo['tempo'] < tempo_terrestre_escolhido) or \
                       (melhor_aereo_alternativo['tempo'] < tempo_terrestre_escolhido + 1.0 and \
                        (tempo_isquemia_max_horas < 18 or urgencia_receptor <= 2)):
                        melhor_modal_candidato = melhor_aereo_alternativo['modal']
            
            melhor_modal = melhor_modal_candidato
        
        count_modals[melhor_modal] = count_modals.get(melhor_modal, 0) + 1
        data.append([
            distancia_km, 
            tempo_isquemia_max_horas,
            urgencia_receptor,
            disp_com_bool,
            horario_comp_com_bool,
            disp_ded_bool,
            melhor_modal
        ])

    df = pd.DataFrame(data, columns=[
        "distancia_km", "tempo_isquemia_max_horas", "urgencia_receptor",
        "disponibilidade_voo_comercial_bool", 
        "horario_compativel_voo_comercial_bool",
        "disponibilidade_voo_dedicado_bool",
        "melhor_modal"
    ])
    
    df.to_csv(OUTPUT_CSV_PATH, index=False)
    print(f"Dados sintéticos V5 gerados e salvos em {OUTPUT_CSV_PATH}")
    print(f"Distribuição dos modais (0:T, 1:AC, 2:AD):\n{df['melhor_modal'].value_counts(normalize=True).sort_index()}")
    print(f"Contagem absoluta dos modais: {count_modals}")


if __name__ == "__main__":
    gerar_dados()
