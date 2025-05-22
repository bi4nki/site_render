import pandas as pd
import numpy as np
import random # Substituído Math.random() por random.random() ou random.uniform()

NUM_SAMPLES = 3000
OUTPUT_CSV_PATH = "synthetic_transport_data.csv"

# --- Constantes para Estimativa de Tempo (horas) ---

# Terrestre
VELOCIDADE_TERRESTRE_KMH = 70

# Aéreo - Tempos de Voo
VELOCIDADE_AEREO_COMERCIAL_KMH = 750 

# Modais: 0 (Terrestre), 1 (Aéreo Comercial), 2 (Aéreo Dedicado)

def simular_tempo_deslocamento_terrestre_total_para_aeroportos(distancia_total_viagem_km):
    """
    Simula o tempo total de deslocamento terrestre SOMADO para:
    (Hospital de Origem -> Aeroporto de Saída) + (Aeroporto de Chegada -> Hospital de Destino).
    Assume que cada trecho individual (ida para aeroporto OU volta do aeroporto)
    leva entre 20min (0.33h) e 1h15min (1.25h).
    """
    tempo_trecho1 = random.uniform(0.33, 1.25)
    tempo_trecho2 = random.uniform(0.33, 1.25)
    return tempo_trecho1 + tempo_trecho2

def calcular_tempo_total_estimado_para_modal(distancia_km, modal, _tempo_desloc_aeroportos_total_horas):
    50
VELOCIDADE_AEREO_DEDICADO_KMH = 650

# Aéreo - Tempos de Solo FIXOS nos Aeroportos (origem + destino combinados)
# (Check-in, segurança, embarque/desembarque da aeronave, taxiamento, etc.)
TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS = 2.0  # Ex: 1h na origem + 1h no destino para processos comerciais
TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS = 1.0   # Ex: 0.5h na origem + 0.5h no destino para processos dedicados/rápidos

# Aéreo - Tempos de Deslocamento Terrestre de/para Aeroportos (SIMULADO por trecho)
# Vamos simular que cada trecho (hospital->aeroporto ou aeroporto->hospital) leva entre 20min e 1h15min
TEMPO_TERRESTRE_AEROPORTO_MIN_HORAS = 0.33 # ~20 minutos"""
    Calcula o tempo total estimado para um modal, incluindo todos os componentes.
    _tempo_desloc_aeroportos_total_horas é usado APENAS para modais aéreos.
    ""
    if modal == 0: # Terrestre
        return distancia_km / VELOCIDADE_TERRESTRE_KMH
    
    elif modal == 1: # Aéreo Comercial
        tempo_voo_puro = distancia_km / VELOCIDADE_AEREO_COMERCIAL_KMH
        return _tempo_desloc_aeroportos_total_horas + TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS + tempo_voo_puro
    
    elif modal == 2: # Aéreo Dedicado
        tempo_voo_puro = distancia_km / VELOCIDADE_AEREO_DEDICADO_KMH
        return _tempo_desloc_aeroportos_total_horas + TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS + tempo_voo_puro
    
    return float('inf')


def gerar_dados():
    data = []
    print("Iniciando geração de dados sintéticos (heurísticas GRANULARES revisadas)...")
    for i in range(NUM_SAMPLES):
        if i % 300 == 0:
            print(f"Gerando amostra {i} de {NUM_SAMPLES}...")

        distancia_km = random.uniform(50, 3500) 
        tempo_isquemia_max_horas = random.choice([4, 6, 8, 12, 18, 24, 30, 36, 48]) # Adicionado 30h
        urgencia_receptor = random.randint(1
TEMPO_TERRESTRE_AEROPORTO_MAX_HORAS = 1.25 # 1 hora e 15 minutos

# Modais: 0 (Terrestre), 1 (Aéreo Comercial), 2 (Aéreo Dedicado)

def calcular_tempo_total_estimado_modal(distancia_km_total_viagem, modal):
    """
    Calcula o tempo total estimado para um modal, incluindo todas as etapas.
    A distancia_km_total_viagem é a distância de "ponta a ponta" (hospital a hospital).
    Para modais aéreos, parte dessa distância é coberta pelo voo, e parte pelos trechos terrestres de/para aeroportos.
    """
    if modal == 0: # Terrestre
        return distancia_km_total_viagem / VELOCIDADE_TERRESTRE_KMH
    
    elif modal == 1: # Aéreo Comercial
        # Simular trechos terrestres de/para aeroportos
        tempo_terrestre_origem_aeroporto = random.uniform(TEMPO_TERRESTRE_AEROPORTO_MIN_HORAS, TEMPO_TERRESTRE_AEROPORTO_MAX_HORAS)
        tempo_terrestre_aeroporto_destino = random.uniform(TEMPO_TERRESTRE_AEROPORTO_MIN_HORAS, TEMPO_TERRESTRE_AEROPORTO_MAX_HORAS)
        
        # A distância do voo é a distância total menos uma estimativa para os trechos terrestres
        # Isso é uma aproximação, pois os aeroportos podem não estar "no caminho" direto.
        distancia_voo_estimada_km = max, 5)

        # Simulação de disponibilidade e custos de voos (pode ser refinada ainda mais)
        disponibilidade_voo_comercial_bool = 0.0
        if distancia_km > 250 and random.random() > 0.1: # 90% chance se > 250km
            disponibilidade_voo_comercial_bool = 1.0
        
        custo_voo_comercial_estimado = 0.0
        if disponibilidade_voo_comercial_bool == 1.0:
            custo_voo_comercial_estimado = float(f"{400 + (distancia_km * random.uniform(0.5, 0.9)):.2f}")

        disponibilidade_voo_dedicado_bool = 0.0
        if (distancia_km > 100 and urgencia_receptor <= 2 and random.random() > 0.35) or \
           (distancia_km > 700 and disponibilidade_voo_comercial_bool == 0.0 and random.random() > 0.25):
            disponibilidade_voo_dedicado_bool = 1.0
        
        custo_voo_dedicado_estimado = 0.0
        if disponibilidade_voo_dedicado_bool == 1.0:
            custo_voo_dedicado_estimado = float(f"{2000 + (distancia_km * random.uniform(2.5, 3.5)):.2f}")

        # --- Lógica Heurística Melhorada para Definir o "Melhor Modal" ---
        
        # Simular o tempo de deslocamento terrestre de/para aeroportos para esta amostra
        tempo_desloc_hosp_aeroportos_total = simular_tempo_deslocamento_terrestre_total_para_aeroportos(distancia_km)

        opcoes_validas = []

        # Avaliar Terrestre
        tempo_t = calcular_tempo_total_estimado_para_modal(distancia_km, 0, 0) # O terceiro arg é ignorado para terrestre
        if tempo_t <= tempo_isquemia_max_horas:
            opcoes_validas.append({"modal": 0, "tempo": tempo_t, "custo": distancia_km * 1.8}) # Custo simulado por km

        # Avaliar Aéreo Comercial
        if disponibilidade_voo_comercial_bool == 1.0:
            tempo_ac = calcular_tempo_total_estimado_para_modal(distancia_km, 1, tempo_desloc_hosp_aeroportos_total)
            if tempo_ac <= tempo_isquemia_max_horas:
                opcoes_validas.append({"modal": 1, "tempo": tempo_ac, "custo": custo_voo_comercial_estimado})
(0, distancia_km_total_viagem - (VELOCIDADE_TERRESTRE_KMH * (tempo_terrestre_origem_aeroporto + tempo_terrestre_aeroporto_destino)))
        if distancia_voo_estimada_km < 50 : # Se a distância de voo for muito pequena, talvez não compense
            distancia_voo_estimada_km = min(50, distancia_km_total_viagem * 0.5) # Garante um pequeno voo ou metade da distância

        tempo_de_voo = distancia_voo_estimada_km / VELOCIDADE_AEREO_COMERCIAL_KMH
        
        return tempo_terrestre_origem_aeroporto + TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS + tempo_de_voo + tempo_terrestre_aeroporto_destino

    elif modal == 2: # Aéreo Dedicado
        tempo_terrestre_origem_aeroporto = random.uniform(TEMPO_TERRESTRE_AEROPORTO_MIN_HORAS, TEMPO_TERRESTRE_AEROPORTO_MAX_HORAS * 0.8) # Dedicado pode usar aeroportos menores/mais próximos
        tempo_terrestre_aeroporto_destino = random.uniform(TEMPO_TERRESTRE_AEROPORTO_MIN_HORAS, TEMPO_TERRESTRE_AEROPORTO_MAX_HORAS * 0.8)
        
        distancia_voo_estimada_km = max(0, distancia_km_total_viagem - (VELOCIDADE_TERRESTRE_KMH * (tempo_terrestre_origem_aeroporto + tempo_terrestre_aeroporto_destino)))
        if distancia_voo_estimada_km < 50 :
            distancia_voo_estimada_km = min(50, distancia_km_total_viagem * 0.5)

        tempo_de_voo = distancia_voo_estimada_km / VELOCIDADE_AEREO_DEDICADO_KMH
        
        return tempo_terrestre_origem_aeroporto + TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS + tempo_de_voo + tempo_terrestre_aeroporto_destino
        
    return float('inf')


def gerar_dados():
    data = []
    print("Iniciando geração de dados sintéticos (heurísticas de tempo revisadas)...")
    for i in range(NUM_SAMPLES):
        if i % 300 == 0:
            print(f"Gerando amostra {i}...")

        # Feature 1: distancia_km (Distância total da viagem hospital a hospital)
        distancia_km = random.uniform        
        # Avaliar Aéreo Dedicado
        if disponibilidade_voo_dedicado_bool == 1.0:
            tempo_ad = calcular_tempo_total_estimado_para_modal(distancia_km, 2, tempo_desloc_hosp_aeroportos_total)
            if tempo_ad <= tempo_isquemia_max_horas:
                opcoes_validas.append({"modal": 2, "tempo": tempo_ad, "custo": custo_voo_dedicado_estimado})
        
        melhor_modal = -1 # Default para "nenhum viável" ou para ser reatribuído

        if not opcoes_validas:
            # Nenhuma opção DENTRO do tempo de isquemia.
            # Para o TCC, se a urgência for máxima, pode-se pegar o mais rápido absoluto
            # mesmo que estoure um pouco. Ou podemos simplesmente não ter um "melhor modal" válido (difícil para treinar).
            # Vamos pegar o mais rápido absoluto neste caso para ter um target.
            # (Poderia ser uma classe '4 = Nenhum Viável' se quisesse)
            
            # Recalcular sem a restrição de isquemia para achar o mais rápido teoricamente
            tempo_t_abs = calcular_tempo_total_estimado_para_modal(distancia_km, 0, 0)
            tempo_ac_abs = float('inf')
            if disponibilidade_voo_comercial_bool == 1.0:
                tempo_ac_abs = calcular_tempo_total_estimado_para_modal(distancia_km, 1, tempo_desloc_hosp_aeroportos_total)
            tempo_ad_abs = float('inf')
            if disponibilidade_voo_dedicado_bool == 1.0:
                tempo_ad_abs = calcular_tempo_total_estimado_para_modal(distancia_km, 2, tempo_desloc_hosp_aeroportos_total)

            min_tempo_abs = min(tempo_t_abs, tempo_ac_abs, tempo_ad_abs)

            if min_tempo_abs == tempo_ad_abs and disponibilidade_voo_dedicado_bool == 1.0:
                melhor_modal = 2
            elif min_tempo_abs == tempo_ac_abs and disponibilidade_voo_comercial_bool == 1.0:
                melhor_modal = 1
            elif min_tempo_abs == tempo_t_abs: # Terrestre é o mais rápido ou único
                melhor_modal = 0
            else: # Caso muito improvável de nada ser calculável
                melhor_modal = 0 # Fallback
        else:
            # Há opções viáveis dentro da isquemia
            if urgencia_receptor <= 2: # Alta urgência, prioriza TEMPO
                opcoes_validas.sort(key=lambda x: x["tempo"])
            else: # Urgência menor, prioriza CUSTO (entre os temporalmente viáveis)
                opcoes_validas.sort(key=lambda x: (x["custo"], x["tempo"]))
            
            melhor_modal = opcoes_validas[0]["modal"]
            
            # Regra adicional para longas distâncias: se terrestre foi escolhido mas aéreo dedicado era viável e mais rápido
            if melhor_modal == 0 and distancia_km > 800:
                for op in opcoes_validas:
                    if op["modal"] == 2 and op["tempo"] < tempo_t: # Se dedicado era viável e mais rápido
                        melhor_modal = 2
                        break
                    elif op["modal"] == 1 and op["tempo"] < tempo_t:  # Ou se comercial era viável e mais rápido
                         melhor_modal = 1
                         # Não quebra, pois dedicado ainda pode ser melhor que comercial
                # Se após checar aéreos,(50, 3500) 
        
        # Feature 2: tempo_isquemia_max_horas
        tempo_isquemia_max_horas = random.choice([4, 6, 8, 12, 18, 24, 36, 48])
        
        # Feature 3: urgencia_receptor
        urgencia_receptor = random.randint(1, 5) # 1=alta, 5=baixa

        # Features 4 & 5: Voo Comercial (Disponibilidade e Custo)
        disponibilidade_voo_comercial_bool = 0.0
        if distancia_km > 250 and random.random() > 0.1: # Mais provável para distâncias não muito curtas
            disponibilidade_voo_comercial_bool = 1.0
        
        custo_voo_comercial_estimado = 0.0
        if disponibilidade_voo_comercial_bool == 1.0:
             custo_voo_comercial_estimado = float(f"{300 + (distancia_km * random.uniform(0.5, 0.9)):.2f}")

        # Features 6 & 7: Voo Dedicado (Disponibilidade e Custo)
        disponibilidade_voo_dedicado_bool = 0.0
        # Mais provável para urgência alta ou quando comercial não atende isquemia, ou distâncias onde comercial é raro
        if (distancia_km > 100 and urgencia_receptor <= 2 and random.random() > 0.4) or \
           (distancia_km > 600 and tempo_isquemia_max_horas < calcular_tempo_total_estimado_modal(distancia_km, 1) and disponibilidade_voo_comercial_bool == 1.0 and random.random() > 0.5) or \
           (distancia_km > 400 and disponibilidade_voo_comercial_bool == 0.0 and random.random() > 0.3):
            disponibilidade_voo_dedicado_bool = 1.0
        
        custo_voo_dedicado_estimado = 0.0
        if disponibilidade_voo_dedicado_bool == 1.0:
            custo_voo_dedicado_estimado = float(f"{2000 + (distancia_km * random.uniform(2.5, 3.5)):.2f}")


        # --- Lógica Heurística Melhorada para Definir o "Melhor Modal" ---
        opcoes_detalhadas = []

        # Calcular tempo para Terrestre
        tempo_t = calcular_tempo_total_estimado_modal(distancia_km, 0)
        if tempo_t <= tempo_isquemia_max_horas:
            opcoes_detalhadas.append({"modal": 0, "tempo": tempo_t, "custo": distancia_km * 1.8}) # Custo simulado por km

        # Calcular tempo para Aéreo Comercial
        if disponibilidade_voo_comercial_bool == 1.0:
            tempo_ac = calcular_tempo_total_estimado_modal(distancia_km, 1)
            if tempo_ac <= tempo_isquemia_max_horas:
                opcoes_detalhadas.append({"modal": 1, "tempo": tempo_ac, "custo": custo_voo_comercial_estimado})
        
        # Calcular tempo para Aéreo Dedicado
        if disponibilidade_voo_dedicado_bool == 1.0:
            tempo_ad = calcular_tempo_total_estimado_modal(distancia_km, 2)
            if tempo_ad <= tempo_isquemia_max_horas:
                opcoes_detalhadas.append({"modal": 2, "tempo": tempo_ad, "custo": custo_voo_dedicado_estimado})
        
        melhor_modal = -1 # Default para "nenhum viável"

        if not opcoes_detalhadas: # Nenhuma opção viável dentro da isquemia
            # Para o TCC, se nada é viável, vamos forçar a escolha do teoricamente mais rápido.
            # Isso pode significar que o modelo aprenderá que algumas combinações de features levam a um modal
            # que * terrestre ainda é o "melhor" (mais rápido ou barato dos viáveis)
                # para longa distância, e existe opção aérea viável, talvez forçar aéreo.
                # Esta parte pode ficar complexa. A lógica acima já deve ajudar.
                # Se o tempo terrestre for, por exemplo, 20h para um órgão de 24h, e um aéreo levar 8h,
                # o aéreo deveria ser preferido mesmo se um pouco mais caro.
                # A ordenação por (custo, tempo) para baixa urgência já tenta balancear isso.

        # Garantia final de que temos um modal
        if melhor_modal == -1: 
            melhor_modal = 0 # Fallback final absoluto

        data.append([
            distancia_km,
            tempo_isquemia_max_horas,
            urgencia_receptor,
            disponibilidade_voo_comercial_bool,
            custo_voo_comercial_estimado,
            disponibilidade_voo_dedicado_bool,
            custo_voo_dedicado_estimado,
            melhor_modal
        ])

    df = pd.DataFrame(data, columns=[
        "distancia_km", "tempo_isquemia_max_horas", "urgencia_receptor",
        "disponibilidade_voo_comercial_bool", "custo_voo_comercial_estimado",
        "disponibilidade_voo_dedicado_bool", "custo_voo_dedicado_estimado",
        "melhor_modal"
    ])
    
    df.to_csv(OUTPUT_CSV_PATH, index=False)
    print(f"Dados sintéticos gerados e salvos em {OUTPUT_CSV_PATH}")
    print(f"Distribuição dos modais (0:Terrestre, 1:Comercial, 2:Dedicado):\n{df['melhor_modal'].value_counts(normalize=True).sort_index()}")

if __name__ == "__main__":
    gerar_dados()
