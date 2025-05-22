import pandas as pd
import numpy as np
import random

# --- Parâmetros da Geração de Dados ---
NUM_SAMPLES = 2000  # Número de amostras de dados a serem geradas
OUTPUT_CSV_PATH = "synthetic_transport_data.csv" # Será salvo na mesma pasta que o script

# Features que vamos simular:
# 1. distancia_km: Distância total em km entre origem e destino do órgão.
# 2. tempo_isquemia_max_horas: Tempo máximo que o órgão pode ficar fora do corpo.
# 3. urgencia_receptor: Nível de urgência do receptor (1=alta, 5=baixa).
# 4. disponibilidade_voo_comercial_bool: 0 (não disponível/viável), 1 (disponível/viável).
# 5. custo_voo_comercial_estimado: Custo simulado.
# 6. disponibilidade_voo_dedicado_bool: 0 (não disponível/viável), 1 (disponível/viável).
# 7. custo_voo_dedicado_estimado: Custo simulado.

# Target (o que queremos prever):
# melhor_modal: 0 (Terrestre), 1 (Aéreo Comercial), 2 (Aéreo Dedicado)

def gerar_dados():
    data = []
    for _ in range(NUM_SAMPLES):
        distancia_km = random.uniform(50, 2000)  # Distâncias variadas
        tempo_isquemia_max_horas = random.choice([4, 6, 12, 24, 48]) # Típico para diferentes órgãos
        urgencia_receptor = random.randint(1, 5)

        # Simulação de disponibilidade e custos de voos
        disponibilidade_voo_comercial_bool = random.choice([0, 1])
        custo_voo_comercial_estimado = 0
        if disponibilidade_voo_comercial_bool == 1:
            custo_voo_comercial_estimado = random.uniform(500, 5000)

        disponibilidade_voo_dedicado_bool = random.choice([0, 1])
        custo_voo_dedicado_estimado = 0
        if disponibilidade_voo_dedicado_bool == 1:
            custo_voo_dedicado_estimado = random.uniform(3000, 20000)
        
        # --- Lógica Heurística para Definir o "Melhor Modal" (Target) ---
        # Esta é uma simplificação! Em um cenário real, seria muito mais complexo.
        # Vamos estimar tempos de viagem (muito simplificado)
        # Velocidade média: Terrestre (80km/h), Comercial (700km/h + 2h fixas), Dedicado (600km/h + 1h fixa)
        
        tempo_terrestre_horas = distancia_km / 80
        tempo_comercial_horas = float('inf')
        if disponibilidade_voo_comercial_bool == 1:
            tempo_comercial_horas = (distancia_km / 700) + 2 
        
        tempo_dedicado_horas = float('inf')
        if disponibilidade_voo_dedicado_bool == 1:
            tempo_dedicado_horas = (distancia_km / 600) + 1

        melhor_modal = 0 # Default para Terrestre

        # Prioridade para urgência alta e tempo de isquemia curto
        if urgencia_receptor <= 2 or tempo_isquemia_max_horas <= 6:
            # Tenta o mais rápido se disponível e dentro da isquemia
            if tempo_dedicado_horas < tempo_isquemia_max_horas and tempo_dedicado_horas < tempo_comercial_horas and tempo_dedicado_horas < tempo_terrestre_horas:
                melhor_modal = 2 # Aéreo Dedicado
            elif tempo_comercial_horas < tempo_isquemia_max_horas and tempo_comercial_horas < tempo_terrestre_horas:
                melhor_modal = 1 # Aéreo Comercial
            elif tempo_terrestre_horas < tempo_isquemia_max_horas:
                melhor_modal = 0 # Terrestre
            else: # Se nada for viável dentro da isquemia, mas precisa ser rápido
                if disponibilidade_voo_dedicado_bool: melhor_modal = 2
                elif disponibilidade_voo_comercial_bool: melhor_modal = 1
                else: melhor_modal = 0 # Fallback
        else: # Menos urgente, considera custo e tempo
            opcoes_viaveis = []
            if tempo_terrestre_horas < tempo_isquemia_max_horas:
                opcoes_viaveis.append({"modal": 0, "tempo": tempo_terrestre_horas, "custo": distancia_km * 2}) # Custo terrestre simulado
            if tempo_comercial_horas < tempo_isquemia_max_horas:
                opcoes_viaveis.append({"modal": 1, "tempo": tempo_comercial_horas, "custo": custo_voo_comercial_estimado})
            if tempo_dedicado_horas < tempo_isquemia_max_horas:
                opcoes_viaveis.append({"modal": 2, "tempo": tempo_dedicado_horas, "custo": custo_voo_dedicado_estimado})

            if opcoes_viaveis:
                # Escolhe o mais barato entre os viáveis
                opcoes_viaveis.sort(key=lambda x: x["custo"])
                melhor_modal = opcoes_viaveis[0]["modal"]
            else: # Se nada for viável, escolhe o mais rápido teoricamente, mesmo que fora da isquemia
                if tempo_dedicado_horas <= tempo_comercial_horas and tempo_dedicado_horas <= tempo_terrestre_horas and disponibilidade_voo_dedicado_bool:
                    melhor_modal = 2
                elif tempo_comercial_horas <= tempo_terrestre_horas and disponibilidade_voo_comercial_bool:
                    melhor_modal = 1
                else:
                    melhor_modal = 0
        
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
    print(f"Distribuição dos modais:\n{df['melhor_modal'].value_counts(normalize=True)}")

if __name__ == "__main__":
    gerar_dados()
