import os
import time # Para medir o tempo
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib
import tensorflow as tf

# --- Definição da instância do Flask ---
app = Flask(__name__)

# --- Constantes e Configurações ---
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
MODEL_NAME = 'organ_transport_model.h5' # CONFIRME ESTE NOME SE FOR DIFERENTE
SCALER_NAME = 'scaler.joblib'          # CONFIRME ESTE NOME SE FOR DIFERENTE
MODEL_PATH = os.path.join(MODEL_DIR, MODEL_NAME)
SCALER_PATH = os.path.join(MODEL_DIR, SCALER_NAME)

# Nomes e ordem das features como foram usadas para treinar o scaler e o modelo
EXPECTED_FEATURE_NAMES = [
    "distancia_km", "tempo_isquemia_max_horas", "urgencia_receptor",
    "disponibilidade_voo_comercial_bool", "custo_voo_comercial_estimado",
    "disponibilidade_voo_dedicado_bool", "custo_voo_dedicado_estimado"
]
# Nomes das classes de saída do modelo, na ordem correta
CLASS_NAMES = ["Terrestre", "Aereo Comercial", "Aereo Dedicado"] # ADAPTE CONFORME SEU TREINAMENTO

# --- Carregamento do Modelo e Scaler ---
model = None
scaler = None
model_load_error = None

print(">>> Iniciando carregamento do modelo e scaler...")
try:
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        model = tf.keras.models.load_model(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        print(f">>> Modelo '{MODEL_PATH}' e scaler '{SCALER_PATH}' carregados com sucesso!")

        # --- Opcional: Warm-up do Modelo ---
        print(">>> Iniciando warm-up do modelo...")
        try:
            num_features = len(EXPECTED_FEATURE_NAMES)
            dummy_data_for_df = [0.0] * num_features # Lista de floats
            dummy_df = pd.DataFrame([dummy_data_for_df], columns=EXPECTED_FEATURE_NAMES)
            dummy_scaled_np = scaler.transform(dummy_df)
            _ = model.predict(dummy_scaled_np)
            print(">>> Warm-up do modelo concluído com sucesso.")
        except Exception as e_warmup:
            print(f">>> ERRO durante o warm-up do modelo: {e_warmup}")
    else:
        model_load_error = f"Arquivo de modelo ({MODEL_PATH}) ou scaler ({SCALER_PATH}) não encontrado."
        print(f">>> ERRO: {model_load_error}")
except Exception as e:
    model_load_error = f"Erro ao carregar modelo ou scaler: {str(e)}"
    print(f">>> ERRO: {model_load_error}")

# --- Rotas da API ---

@app.route('/')
def home():
    if model and scaler and not model_load_error:
        return "Serviço de ML para Otimização de Transporte de Órgãos está funcionando (modelo e scaler carregados)."
    elif model_load_error:
        return f"Serviço de ML está funcionando, MAS HOUVE ERRO: {model_load_error}", 500
    else:
        return "Serviço de ML está funcionando, mas o estado do modelo/scaler é desconhecido.", 500


@app.route('/health')
def health_check():
    if model and scaler and not model_load_error:
        return jsonify({"status": "healthy", "message": "Modelo e scaler carregados."}), 200
    else:
        error_message = model_load_error or "Modelo ou scaler não carregado por razão desconhecida."
        return jsonify({"status": "unhealthy", "message": error_message}), 500


@app.route('/predict', methods=['POST'])
def predict():
    print("LOG PREDICT: >>> Rota /predict ACIONADA <<<") # Log bem no início
    predict_start_time = time.time()

    # A checagem de model e scaler está comentada para este teste específico
    # if not model or not scaler:
    #     error_msg = model_load_error or "Modelo ou scaler não está carregado."
    #     print(f"LOG PREDICT: Tentativa de predição falhou - {error_msg}")
    #     return jsonify({"error": error_msg + " Verifique os logs de inicialização do servidor."}), 500

    try:
        data = request.get_json()
        if not data:
            print("LOG PREDICT: Payload JSON vazio ou inválido")
            return jsonify({"error": "Payload JSON vazio ou inválido"}), 400
        
        print(f"LOG PREDICT: Dados JSON recebidos: {data}")

        features_list = data.get('features')
        if features_list is None or not isinstance(features_list, list) or not features_list:
            print("LOG PREDICT: Chave 'features' ausente, não é uma lista ou está vazia.")
            return jsonify({"error": "Chave 'features' ausente, não é uma lista ou está vazia."}), 400
        
        print(f"LOG PREDICT: Features recebidas da lista: {features_list}")

        # ---- SEÇÃO DO MODELO E SCALER TEMPORARIAMENTE COMENTADA PARA TESTE ----
        # if len(features_list) != len(EXPECTED_FEATURE_NAMES):
        #     print(f"LOG PREDICT: Número incorreto de features. Esperado {len(EXPECTED_FEATURE_NAMES)}, recebido {len(features_list)}")
        #     return jsonify({"error": f"Número incorreto de features. Esperado {len(EXPECTED_FEATURE_NAMES)}, recebido {len(features_list)}"}), 400

        # preprocess_start_time = time.time()
        # try:
        #     features_list_float = [float(f) for f in features_list]
        #     input_df = pd.DataFrame([features_list_float], columns=EXPECTED_FEATURE_NAMES)
        #     scaled_features_np = scaler.transform(input_df) 
        # except ValueError as ve:
        #     print(f"LOG PREDICT: Erro de valor durante a conversão/preparação dos dados: {ve}")
        #     return jsonify({"error": f"Erro ao converter features para números ou preparar dados: {str(ve)}"}), 400
        # except Exception as e_scale:
        #     print(f"LOG PREDICT: Erro no scaling ou preparação dos dados: {e_scale}")
        #     return jsonify({"error": f"Erro ao aplicar o scaler ou preparar dados: {str(e_scale)}"}), 400
        
        # preprocess_time = time.time() - preprocess_start_time
        # print(f"LOG PREDICT: Features escaladas (formato NumPy): {scaled_features_np}")
        # print(f"LOG PREDICT: Tipo de scaled_features_np: {type(scaled_features_np)}")
        # print(f"LOG PREDICT: Shape de scaled_features_np: {scaled_features_np.shape}")
        # print(f"LOG PREDICT: Tempo de pré-processamento: {preprocess_time:.4f}s")

        # model_predict_start_time = time.time()
        # try:
        #     prediction_probabilities = model.predict(scaled_features_np)
        #     predicted_class_index = np.argmax(prediction_probabilities, axis=1)[0]
        # except Exception as e_predict:
        #     print(f"LOG PREDICT: Erro na predição do modelo: {e_predict}")
        #     return jsonify({"error": f"Erro ao fazer a predição com o modelo: {str(e_predict)}"}), 500
        
        # model_predict_time = time.time() - model_predict_start_time
        # print(f"LOG PREDICT: Probabilidades: {prediction_probabilities.tolist()[0]}")
        # print(f"LOG PREDICT: Índice da classe prevista: {predicted_class_index}")
        # print(f"LOG PREDICT: Tempo de predição do modelo: {model_predict_time:.4f}s")
        
        # if 0 <= predicted_class_index < len(CLASS_NAMES):
        #     predicted_transport_mode = CLASS_NAMES[predicted_class_index]
        # else:
        #     predicted_transport_mode = "Classe Desconhecida"
        #     print(f"LOG PREDICT: Índice de classe previsto ({predicted_class_index}) fora do alcance de CLASS_NAMES.")
        # -------------------------------------------------------------

        # Resposta Dummy para este teste
        predicted_transport_mode_dummy = "TESTE - MODELO DESABILITADO"
        predicted_class_index_dummy = -1
        prediction_probabilities_dummy = []
        
        total_predict_time = time.time() - predict_start_time
        print(f"LOG PREDICT: Tempo total da requisição /predict (modelo desabilitado): {total_predict_time:.4f}s")

        return jsonify({
            "message": "Teste da rota /predict com modelo desabilitado bem-sucedido!",
            "received_features": features_list, # Retorna as features recebidas para confirmação
            "predicted_transport_mode": predicted_transport_mode_dummy,
            "predicted_class_index": int(predicted_class_index_dummy),
            "probabilities": prediction_probabilities_dummy
        })

    except Exception as e: # Captura exceções que podem ocorrer antes da lógica do modelo
        print(f"LOG PREDICT: Erro inesperado GERAL na rota /predict: {e}")
        return jsonify({"error": f"Erro interno inesperado no servidor (geral)."}), 500


# --- Bloco para execução local (Gunicorn não usa isso diretamente no Render) ---
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
