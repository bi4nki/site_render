import os
import time
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib
import tensorflow as tf

# --- Definição da instância do Flask ---
app = Flask(__name__)

# --- Constantes e Configurações ---
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
TFLITE_MODEL_NAME = 'organ_transport_model_v2.tflite' 
SCALER_NAME = 'scaler_v2.joblib'                     
TFLITE_MODEL_PATH = os.path.join(MODEL_DIR, TFLITE_MODEL_NAME)
SCALER_PATH = os.path.join(MODEL_DIR, SCALER_NAME)

EXPECTED_FEATURE_NAMES = [
    "distancia_km", "tempo_isquemia_max_horas", "urgencia_receptor",
    "disponibilidade_voo_comercial_bool", 
    "horario_compativel_voo_comercial_bool", 
    "disponibilidade_voo_dedicado_bool"
]
CLASS_NAMES = ["Terrestre", "Aereo Comercial", "Aereo Dedicado"] 

# --- Carregamento do Modelo TFLite e Scaler ---
interpreter = None
scaler = None
input_details = None
output_details = None
model_load_error = None

print(">>> Iniciando carregamento do modelo TFLite (V2) e scaler (V2)...")
try:
    if os.path.exists(TFLITE_MODEL_PATH) and os.path.exists(SCALER_PATH):
        interpreter = tf.lite.Interpreter(model_path=TFLITE_MODEL_PATH)
        interpreter.allocate_tensors() 
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        print(f">>> Detalhes da entrada do modelo TFLite V2: {input_details}")

        scaler = joblib.load(SCALER_PATH)
        print(f">>> Modelo TFLite '{TFLITE_MODEL_PATH}' e scaler '{SCALER_PATH}' carregados com sucesso!")

        print(">>> Iniciando warm-up do modelo TFLite V2...")
        try:
            num_features = len(EXPECTED_FEATURE_NAMES) 
            if num_features != input_details[0]['shape'][-1]: 
                raise ValueError(f"Warm-up: Incompatibilidade de features. Esperado no modelo: {input_details[0]['shape'][-1]}, Definido em EXPECTED_FEATURE_NAMES: {num_features}")

            dummy_data_for_df = [0.0] * num_features
            dummy_df = pd.DataFrame([dummy_data_for_df], columns=EXPECTED_FEATURE_NAMES)
            dummy_scaled_np = scaler.transform(dummy_df)
            
            input_dtype = input_details[0]['dtype']
            dummy_input_for_tflite = dummy_scaled_np.astype(input_dtype)

            interpreter.set_tensor(input_details[0]['index'], dummy_input_for_tflite)
            interpreter.invoke()
            _ = interpreter.get_tensor(output_details[0]['index'])
            print(">>> Warm-up do modelo TFLite V2 concluído com sucesso.")
        except Exception as e_warmup:
            model_load_error = f"ERRO durante o warm-up do modelo TFLite V2: {e_warmup}" 
            print(f">>> {model_load_error}")
    else:
        model_load_error = f"Arquivo de modelo TFLite ({TFLITE_MODEL_PATH}) ou scaler ({SCALER_PATH}) não encontrado."
        print(f">>> ERRO: {model_load_error}")
except Exception as e:
    model_load_error = f"Erro crítico ao carregar modelo TFLite V2 ou scaler: {str(e)}"
    print(f">>> ERRO: {model_load_error}")

# --- Rotas da API ---
@app.route('/')
def home():
    if interpreter and scaler and not model_load_error:
        return "Serviço de ML (TFLite V2) para Otimização de Transporte de Órgãos está funcionando."
    elif model_load_error:
        return f"Serviço de ML (V2) está funcionando, MAS HOUVE ERRO: {model_load_error}", 500
    else:
        return "Serviço de ML (V2) está funcionando, mas o estado do modelo/scaler é desconhecido.", 500

@app.route('/health')
def health_check():
    if interpreter and scaler and not model_load_error:
        return jsonify({"status": "healthy", "message": "Modelo TFLite V2 e scaler carregados."}), 200
    else:
        error_message = model_load_error or "Modelo TFLite V2 ou scaler não carregado."
        return jsonify({"status": "unhealthy", "message": error_message}), 500

@app.route('/predict', methods=['POST'])
def predict():
    print("LOG PREDICT (TFLite V2): >>> Rota /predict ACIONADA <<<")
    predict_start_time = time.time()

    if not interpreter or not scaler:
        error_msg = model_load_error or "Modelo TFLite V2 ou scaler não está carregado."
        print(f"LOG PREDICT (TFLite V2): Tentativa de predição falhou - {error_msg}")
        return jsonify({"error": error_msg + " Verifique os logs de inicialização."}), 500
    if not input_details or not output_details:
        print(f"LOG PREDICT (TFLite V2): Detalhes de input/output do modelo TFLite não inicializados.")
        return jsonify({"error": "Detalhes do modelo TFLite não inicializados. Verifique os logs de inicialização."}), 500

    try:
        data = request.get_json()
        if not data:
            print("LOG PREDICT (TFLite V2): Payload JSON vazio ou inválido")
            return jsonify({"error": "Payload JSON vazio ou inválido"}), 400
        
        features_list = data.get('features')
        if features_list is None or not isinstance(features_list, list) or not features_list:
            print("LOG PREDICT (TFLite V2): Chave 'features' ausente ou inválida.")
            return jsonify({"error": "Chave 'features' ausente, não é uma lista ou está vazia."}), 400
        
        print(f"LOG PREDICT (TFLite V2): Features recebidas: {features_list}")

        if len(features_list) != len(EXPECTED_FEATURE_NAMES):
            print(f"LOG PREDICT (TFLite V2): Número incorreto de features. Esperado {len(EXPECTED_FEATURE_NAMES)}, recebido {len(features_list)}")
            return jsonify({"error": f"Número incorreto de features. Esperado {len(EXPECTED_FEATURE_NAMES)}, recebido {len(features_list)}"}), 400

        # Pré-processamento
        preprocess_start_time = time.time()
        try:
            features_list_float = [float(f) for f in features_list]
            input_df = pd.DataFrame([features_list_float], columns=EXPECTED_FEATURE_NAMES)
            scaled_features_np = scaler.transform(input_df) 
            
            input_dtype = input_details[0]['dtype']
            input_data_for_tflite = scaled_features_np.astype(input_dtype)

        except ValueError as ve:
            print(f"LOG PREDICT (TFLite V2): Erro de valor durante a conversão/preparação dos dados: {ve}")
            return jsonify({"error": f"Erro ao converter features para números ou preparar dados: {str(ve)}"}), 400
        except Exception as e_scale: 
            print(f"LOG PREDICT (TFLite V2): Erro no scaling ou preparação dos dados: {e_scale}")
            return jsonify({"error": f"Erro ao aplicar o scaler ou preparar dados: {str(e_scale)}"}), 400
        
        preprocess_time = time.time() - preprocess_start_time
        print(f"LOG PREDICT (TFLite V2): Tempo de pré-processamento: {preprocess_time:.4f}s")

        # Predição com TFLite
        model_predict_start_time = time.time()
        try:
            interpreter.set_tensor(input_details[0]['index'], input_data_for_tflite)
            interpreter.invoke()
            prediction_probabilities = interpreter.get_tensor(output_details[0]['index'])
            predicted_class_index = np.argmax(prediction_probabilities, axis=1)[0]
        except Exception as e_predict:
            print(f"LOG PREDICT (TFLite V2): Erro na predição do modelo TFLite: {e_predict}")
            return jsonify({"error": f"Erro na predição com TFLite: {str(e_predict)}"}), 500
        
        model_predict_time = time.time() - model_predict_start_time
        print(f"LOG PREDICT (TFLite V2): Probabilidades: {prediction_probabilities.tolist()[0]}")
        print(f"LOG PREDICT (TFLite V2): Índice da classe prevista: {predicted_class_index}")
        print(f"LOG PREDICT (TFLite V2): Tempo de predição TFLite: {model_predict_time:.4f}s")
        
        if 0 <= predicted_class_index < len(CLASS_NAMES):
            predicted_transport_mode = CLASS_NAMES[predicted_class_index]
        else: 
            predicted_transport_mode = "Classe Desconhecida"
            print(f"LOG PREDICT (TFLite V2): Índice de classe previsto ({predicted_class_index}) fora do alcance.")

        total_predict_time = time.time() - predict_start_time
        print(f"LOG PREDICT (TFLite V2): Tempo total da requisição /predict: {total_predict_time:.4f}s")

        return jsonify({
            "predicted_transport_mode": predicted_transport_mode,
            "predicted_class_index": int(predicted_class_index),
            "probabilities": prediction_probabilities.tolist()[0]
        })

    except Exception as e:
        print(f"LOG PREDICT (TFLite V2): Erro inesperado GERAL: {e}")
        return jsonify({"error": "Erro interno inesperado no servidor."}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
