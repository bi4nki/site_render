import os
import time
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib
import tensorflow as tf # TensorFlow ainda é necessário para o tf.lite.Interpreter

# --- Definição da instância do Flask ---
app = Flask(__name__)

# --- Constantes e Configurações ---
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
TFLITE_MODEL_NAME = 'organ_transport_model.tflite' # Usaremos o modelo TFLite
SCALER_NAME = 'scaler.joblib'
TFLITE_MODEL_PATH = os.path.join(MODEL_DIR, TFLITE_MODEL_NAME)
SCALER_PATH = os.path.join(MODEL_DIR, SCALER_NAME)

EXPECTED_FEATURE_NAMES = [
    "distancia_km", "tempo_isquemia_max_horas", "urgencia_receptor",
    "disponibilidade_voo_comercial_bool", "custo_voo_comercial_estimado",
    "disponibilidade_voo_dedicado_bool", "custo_voo_dedicado_estimado"
]
CLASS_NAMES = ["Terrestre", "Aereo Comercial", "Aereo Dedicado"]

# --- Carregamento do Modelo TFLite e Scaler ---
interpreter = None # Para o TFLite Interpreter
scaler = None
input_details = None # Detalhes de entrada do modelo TFLite
output_details = None # Detalhes de saída do modelo TFLite
model_load_error = None

print(">>> Iniciando carregamento do modelo TFLite e scaler...")
try:
    if os.path.exists(TFLITE_MODEL_PATH) and os.path.exists(SCALER_PATH):
        interpreter = tf.lite.Interpreter(model_path=TFLITE_MODEL_PATH)
        interpreter.allocate_tensors() # ESSENCIAL para TFLite

        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        
        # Verificar o tipo de dado esperado pela entrada do modelo TFLite
        print(f">>> Detalhes da entrada do modelo TFLite: {input_details}")
        # Exemplo: [{'name': 'serving_default_dense_input:0', 'index': 0, 'shape': array([1, 7]), 'dtype': <class 'numpy.float32'>, ...}]
        # A linha acima mostra que o modelo espera float32

        scaler = joblib.load(SCALER_PATH)
        print(f">>> Modelo TFLite '{TFLITE_MODEL_PATH}' e scaler '{SCALER_PATH}' carregados com sucesso!")

        # --- Warm-up do Modelo TFLite ---
        print(">>> Iniciando warm-up do modelo TFLite...")
        try:
            num_features = len(EXPECTED_FEATURE_NAMES)
            dummy_data_for_df = [0.0] * num_features
            dummy_df = pd.DataFrame([dummy_data_for_df], columns=EXPECTED_FEATURE_NAMES)
            dummy_scaled_np = scaler.transform(dummy_df)
            
            # Converter para o tipo de dado esperado pelo modelo (geralmente float32)
            input_dtype = input_details[0]['dtype']
            dummy_input_for_tflite = dummy_scaled_np.astype(input_dtype)

            interpreter.set_tensor(input_details[0]['index'], dummy_input_for_tflite)
            interpreter.invoke() # Executa a inferência
            _ = interpreter.get_tensor(output_details[0]['index']) # Pega o resultado (não usado no warm-up)
            print(">>> Warm-up do modelo TFLite concluído com sucesso.")
        except Exception as e_warmup:
            print(f">>> ERRO durante o warm-up do modelo TFLite: {e_warmup}")
    else:
        model_load_error = f"Arquivo de modelo TFLite ({TFLITE_MODEL_PATH}) ou scaler ({SCALER_PATH}) não encontrado."
        print(f">>> ERRO: {model_load_error}")
except Exception as e:
    model_load_error = f"Erro ao carregar modelo TFLite ou scaler: {str(e)}"
    print(f">>> ERRO: {model_load_error}")

# --- Rotas da API ---
@app.route('/')
def home():
    if interpreter and scaler and not model_load_error: # Checa 'interpreter' agora
        return "Serviço de ML (TFLite) para Otimização de Transporte de Órgãos está funcionando."
    elif model_load_error:
        return f"Serviço de ML está funcionando, MAS HOUVE ERRO: {model_load_error}", 500
    else:
        return "Serviço de ML está funcionando, mas o estado do modelo/scaler é desconhecido.", 500

@app.route('/health')
def health_check():
    if interpreter and scaler and not model_load_error:
        return jsonify({"status": "healthy", "message": "Modelo TFLite e scaler carregados."}), 200
    else:
        error_message = model_load_error or "Modelo TFLite ou scaler não carregado."
        return jsonify({"status": "unhealthy", "message": error_message}), 500

@app.route('/predict', methods=['POST'])
def predict():
    print("LOG PREDICT (TFLite): >>> Rota /predict ACIONADA <<<")
    predict_start_time = time.time()

    if not interpreter or not scaler: # Checa 'interpreter'
        error_msg = model_load_error or "Modelo TFLite ou scaler não está carregado."
        print(f"LOG PREDICT (TFLite): Tentativa de predição falhou - {error_msg}")
        return jsonify({"error": error_msg + " Verifique os logs de inicialização."}), 500

    try:
        data = request.get_json()
        if not data: # ... (validações de JSON e features como antes) ...
            print("LOG PREDICT (TFLite): Payload JSON vazio ou inválido")
            return jsonify({"error": "Payload JSON vazio ou inválido"}), 400
        
        features_list = data.get('features')
        if features_list is None or not isinstance(features_list, list) or not features_list:
            print("LOG PREDICT (TFLite): Chave 'features' ausente ou inválida.")
            return jsonify({"error": "Chave 'features' ausente, não é uma lista ou está vazia."}), 400
        
        if len(features_list) != len(EXPECTED_FEATURE_NAMES):
            print(f"LOG PREDICT (TFLite): Número incorreto de features.")
            return jsonify({"error": f"Número incorreto de features. Esperado {len(EXPECTED_FEATURE_NAMES)}, recebido {len(features_list)}"}), 400

        # 1. Pré-processamento (Scaling)
        preprocess_start_time = time.time()
        try:
            features_list_float = [float(f) for f in features_list]
            input_df = pd.DataFrame([features_list_float], columns=EXPECTED_FEATURE_NAMES)
            scaled_features_np = scaler.transform(input_df)
        except Exception as e_scale: # ... (tratamento de erro do scaler como antes) ...
            print(f"LOG PREDICT (TFLite): Erro no scaling: {e_scale}")
            return jsonify({"error": f"Erro ao aplicar o scaler: {str(e_scale)}"}), 400
        
        preprocess_time = time.time() - preprocess_start_time
        print(f"LOG PREDICT (TFLite): Tempo de pré-processamento: {preprocess_time:.4f}s")

        # 2. Predição com o modelo TFLite
        model_predict_start_time = time.time()
        try:
            # Converter para o tipo de dado esperado pela entrada do TFLite (geralmente float32)
            input_dtype = input_details[0]['dtype']
            input_data_for_tflite = scaled_features_np.astype(input_dtype)

            interpreter.set_tensor(input_details[0]['index'], input_data_for_tflite)
            interpreter.invoke() # Executa a inferência
            prediction_probabilities = interpreter.get_tensor(output_details[0]['index'])
            
            predicted_class_index = np.argmax(prediction_probabilities, axis=1)[0]
        except Exception as e_predict:
            print(f"LOG PREDICT (TFLite): Erro na predição do modelo TFLite: {e_predict}")
            return jsonify({"error": f"Erro na predição com TFLite: {str(e_predict)}"}), 500
        
        model_predict_time = time.time() - model_predict_start_time
        print(f"LOG PREDICT (TFLite): Probabilidades: {prediction_probabilities.tolist()[0]}")
        print(f"LOG PREDICT (TFLite): Índice da classe prevista: {predicted_class_index}")
        print(f"LOG PREDICT (TFLite): Tempo de predição TFLite: {model_predict_time:.4f}s")
        
        if 0 <= predicted_class_index < len(CLASS_NAMES):
            predicted_transport_mode = CLASS_NAMES[predicted_class_index]
        else:
            predicted_transport_mode = "Classe Desconhecida"
            print(f"LOG PREDICT (TFLite): Índice de classe previsto ({predicted_class_index}) fora do alcance.")

        total_predict_time = time.time() - predict_start_time
        print(f"LOG PREDICT (TFLite): Tempo total da requisição /predict: {total_predict_time:.4f}s")

        return jsonify({
            "predicted_transport_mode": predicted_transport_mode,
            "predicted_class_index": int(predicted_class_index),
            "probabilities": prediction_probabilities.tolist()[0]
        })

    except Exception as e: # Captura exceções gerais na rota
        print(f"LOG PREDICT (TFLite): Erro inesperado GERAL: {e}")
        return jsonify({"error": "Erro interno inesperado no servidor."}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
