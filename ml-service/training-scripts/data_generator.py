import pandas as pd
import numpy as np
import random

NUM_SAMPLES = 3000
OUTPUT_CSV_PATH = "synthetic_transport_data.csv"

# --- Constantes para Estimativa de Tempo (horas) ---

# Terrestre
VELOCIDADE_TERRESTRE_KMH = 70

# Aéreo - Tempos de Voo Puro
VELOCIDADE_AEREO_COMERCIAL_KMH = 750
VELOCIDADE_AEREO_DEDICADO_KMH = 650

# Aéreo - Tempos de Solo FIXOS nos Aeroportos (para os dois aeroportos, origem + destino combinados)
# Inclui check-in da equipe/carga, carregamento, taxiamento, desembarque, etc.
TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS = 2.0  # Ex: 1h na origem + 1h no destino para processos comerciais
TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS = 1.0   # Ex: 0.5h na origem + 0.5h no destino para processos dedicados/rápidos

# Modais: 0 (Terrestre), 1 (Aéreo Comercial), 2 (Aéreo Dedicado)

def simular_tempo_deslocamento_terrestre_total_para_aeroportos():
    """
    Simula o tempo total de deslocamento terrestre SOMADO para:
    (Hospital de Origem -> Aeroporto de Saída) + (Aeroporto de Chegada -> Hospital de Destino).
    Assume que cada trecho individual leva entre 20min (0.33h) e 1h15min (1.25h).
    """
    tempo_trecho1 = random.uniform(0.33, 1.25)
    tempo_trecho2 = random.uniform(0.33, 1.25)
    return tempo_trecho1 + tempo_trecho2

def calcular_tempo_total_estimado_para_modal(distancia_km, modal, _tempo_desloc_aeroportos_total_horas):
    """
    Calcula o tempo total estimado para um modal, incluindo todos os componentes.
    _tempo_desloc_aeroportos_total_horas é usado APENAS para modais aéreos.
    A distancia_km aqui refere-se à distância que seria coberta pelo voo, se aéreo.
    Para terrestre, é a distância total.
    """
    if modal == 0: # Terrestre
        return distancia_km / VELOCIDADE_TERRESTRE_KMH
    
    elif modal == 1: # Aéreo Comercial
        # Assume-se que distancia_km para aéreo é a distância de voo.
        # O tempo de deslocamento terrestre para aeroportos é adicionado separadamente.
        tempo_voo_puro = distancia_km / VELOCIDADE_AEREO_COMERCIAL_KMH
        return _tempo_desloc_aeroportos_total_horas + TEMPO_SOLO_AEROPORTOS_COMERCIAL_HORAS + tempo_voo_puro
    
    elif modal == 2: # Aéreo Dedicado
        tempo_voo_puro = distancia_km / VELOCIDADE_AEREO_DEDICADO_KMH
        return _tempo_desloc_aeroportos_total_horas + TEMPO_SOLO_AEROPORTOS_DEDICADO_HORAS + tempo_voo_puro
    
    return float('inf')


def gerar_dados():
    data = []
    print("Iniciando geração de dados sintéticos (heurísticas GRANULARES CORRIGIDAS)...")
    for i in range(NUM_SAMPLES):
        if i % 300 == 0:
            print(f"Gerando amostra {i} de {NUM_SAMPLES}...")

        # Feature 1: distancia_km (Distância total da viagem hospital a hospital)
        distancia_km_total_ponta_a_ponta = random.uniform(50, 3500) 
        
        # Feature 2: tempo_isquemia_max_horas
        tempo_isquemia_max_horas = random.choice([4, 6, 8, 12, 18, 24, 30, 36, 48])
        
        # Feature 3: urgencia_receptor
        urgencia_receptor = random.randint(1, 5) # 1=alta, 5=baixa

        # Features 4 & 5: Voo Comercial (Disponibilidade e Custo)
        disponibilidade_voo_comercial_bool = 0.0
        if distancia_km_total_ponta_a_ponta > 250 and random.random() > 0.1: 
            disponibilidade_voo_comercial_bool = 1.0
        
        custo_voo_comercial_estimado = 0.0
        if disponibilidade_voo_comercial_bool == 1.0:
            custo_voo_comercial_estimado = float(f"{400 + (distancia_km_total_ponta_a_ponta * random.uniform(0.5, 0.9)):.2f}")

        # Features 6 & 7: Voo Dedicado (Disponibilidade e Custo)
        disponibilidade_voo_dedicado_bool = 0.0
        if (distancia_km_total_ponta_a_ponta > 100 and urgencia_receptor <= 2 and random.random() > 0.35) or \
           (distancia_km_total_ponta_a_ponta > 700 and disponibilidade_voo_comercial_bool == 0.0 and random.random() > 0.25): # Se comercial não disponível para longa distância
            disponibilidade_voo_dedicado_bool = 1.0
        
        custo_voo_dedicado_estimado = 0.0
        if disponibilidade_voo_dedicado_bool == 1.0:
            custo_voo_dedicado_estimado = float(f"{2000 + (distancia_km_total_ponta_a_ponta * random.uniform(2.5, 3.5)):.2f}")

        # --- Lógica Heurística Melhorada para Definir o "Melhor Modal" ---
        
        # Simular o tempo de deslocamento terrestre de/para aeroportos para esta amostra
        # Este tempo NÃO é uma feature direta do modelo, mas é usado para calcular o tempo total dos modais aéreos
        tempo_desloc_hosp_aeroportos_total_simulado = simular_tempo_deslocamento_terrestre_total_para_aeroportos()

        opcoes_validas = []

        # Avaliar Terrestre (usa a distancia_km_total_ponta_a_ponta)
        tempo_t = calcular_tempo_total_estimado_para_modal(distancia_km_total_ponta_a_ponta, 0, 0) # Terceiro arg é ignorado
        if tempo_t <= tempo_isquemia_max_horas:
            opcoes_validas.append({"modal": 0, "tempo": tempo_t, "custo": distancia_km_total_ponta_a_ponta * 1.8})

        # Avaliar Aéreo Comercial
        # A distancia_km para os modais aéreos aqui pode ser a distancia_km_total_ponta_a_ponta,
        # já que o cálculo dentro de calcular_tempo_total_estimado_para_modal já considera
        # o tempo de voo puro e adiciona os tempos de solo e deslocamento terrestre simulado.
        if disponibilidade_voo_comercial_bool == 1.0:
            tempo_ac = calcular_tempo_total_estimado_para_modal(distancia_km_total_ponta_a_ponta, 1, tempo_desloc_hosp_aeroportos_total_simulado)
            if tempo_ac <= tempo_isquemia_max_horas:
                opcoes_validas.append({"modal": 1, "tempo": tempo_ac, "custo": custo_voo_comercial_estimado})
        
        # Avaliar Aéreo Dedicado
        if disponibilidade_voo_dedicado_bool == 1.0:
            tempo_ad = calcular_tempo_total_estimado_para_modal(distancia_km_total_ponta_a_ponta, 2, tempo_desloc_hosp_aeroportos_total_simulado)
            if tempo_ad <= tempo_isquemia_max_horas:
                opcoes_validas.append({"modal": 2, "tempo": tempo_ad, "custo": custo_voo_dedicado_estimado})
        
        melhor_modal = -1 

        if not opcoes_validas: # Nenhuma opção viável DENTRO da isquemia
            # Escolhe o mais rápido absoluto para ter um target
            tempo_t_abs = calcular_tempo_total_estimado_para_modal(distancia_km_total_ponta_a_ponta, 0, 0)
            tempo_ac_abs = float('inf')
            if disponibilidade_voo_comercial_bool == 1.0:
                tempo_ac_abs = calcular_tempo_total_estimado_para_modal(distancia_km_total_ponta_a_ponta, 1, tempo_desloc_hosp_aeroportos_total_simulado)
            tempo_ad_abs = float('inf')
            if disponibilidade_voo_dedicado_bool == 1.0:
                tempo_ad_abs = calcular_tempo_total_estimado_para_modal(distancia_km_total_ponta_a_ponta, 2, tempo_desloc_hosp_aeroportos_total_simulado)

            all_options_theoretical = [
                {"modal": 0, "tempo": tempo_t_abs},
                {"modal": 1, "tempo": tempo_ac_abs},
                {"modal": 2, "tempo": tempo_ad_abs}
            ]
            # Remover opções com tempo infinito (indisponíveis)
            all_options_theoretical_valid = [opt for opt in all_options_theoretical if opt['tempo'] != float('inf')]

            if all_options_theoretical_valid:
                all_options_theoretical_valid.sort(key=lambda x: x["tempo"])
                melhor_modal = all_options_theoretical_valid[0]["modal"]
            else: # Caso extremo
                melhor_modal = 0 
        else: # Há opções viáveis dentro da isquemia
            if urgencia_receptor <= 2: 
                opcoes_validas.sort(key=lambda x: x["tempo"])
            else: 
                opcoes_validas.sort(key=lambda x: (x["custo"], x["tempo"]))
            
            melhor_modal = opcoes_validas[0]["modal"]
            
            # Regra adicional para evitar terrestre em longas distâncias se aéreo é viável e MUITO mais rápido
            if melhor_modal == 0 and distancia_km_total_ponta_a_ponta > 700: # Distância limite para reconsiderar
                tempo_terrestre_escolhido = next(opt['tempo'] for opt in opcoes_validas if opt['modal'] == 0)
                opcoes_aereas_mais_rapidas_e_viaveis = [
                    opt for opt in opcoes_validas 
                    if opt['modal'] in [1, 2] and opt['tempo'] < (tempo_terrestre_escolhido * 0.7) # Significativamente mais rápido
                ]
                if opcoes_aereas_mais_rapidas_e_viaveis:
                    opcoes_aereas_mais_rapidas_e_viaveis.sort(key=lambda x: x['tempo']) # Pega o aéreo mais rápido
                    melhor_modal = opcoes_aereas_mais_rapidas_e_viaveis[0]['modal']

        data.append([
            distancia_km_total_ponta_a_ponta, # Esta é a feature que vai para o modelo
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
