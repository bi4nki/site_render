import os
from flask import Flask, request, jsonify
import pandas as pd # Certifique-se que está no requirements.txt
import numpy as np  # Certifique-se que está no requirements.txt
import joblib       # Certifique-se que está no requirements.txt
import tensorflow as tf # Certifique-se que está no requirements.txt

app = Flask(__name__)

# --- Carregamento do Modelo e Scaler ---
# Caminhos relativos à localização de app.py
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
MODEL_PATH = os.path.join(MODEL_DIR, 'organ_transport_model.h5') # CONFIRME O NOME DO ARQUIVO
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.joblib')         # CONFIRME O NOME DO ARQUIVO

model = None
scaler = None

try:
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        model = tf.keras.models.load_model(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        print(">>> Modelo e scaler carregados com sucesso!")
    else:
        print(f">>> ERRO: Arquivo de modelo ({MODEL_PATH}) ou scaler ({SCALER_PATH}) não encontrado.")
except Exception as e:
    print(f">>> ERRO ao carregar modelo ou scaler: {e}")
    # Em um cenário real, você pode querer que o app não inicie ou tenha um status de "não saudável"
    # se os modelos não puderem ser carregados.

@app.route('/')
def home():
    if model and scaler:
        return "Serviço de ML para Otimização de Transporte de Órgãos está funcionando (modelo carregado)."
    else:
        return "Serviço de ML está funcionando, MAS HOUVE ERRO AO CARREGAR MODELO/SCALER."

@app.route('/health')
def health_check():
    if model and scaler:
        return jsonify({"status": "healthy", "model_loaded": True}), 200
    else:
        return jsonify({"status": "unhealthy", "model_loaded": False, "message": "Modelo ou scaler não carregado"}), 500

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not scaler:
        return jsonify({"error": "Modelo ou scaler não está carregado. Verifique os logs do servidor."}), 500

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Payload JSON vazio ou inválido"}), 400

        # Assumindo que 'data' contém uma chave 'features' que é uma lista de valores
        # Ex: { "features": [val1, val2, val3, ...] }
        # A ordem e o número de features devem corresponder ao que o modelo espera
        features_list = data.get('features')
        if features_list is None or not isinstance(features_list, list):
            return jsonify({"error": "Chave 'features' ausente, não é uma lista ou está vazia."}), 400
        
        print(f"Features recebidas: {features_list}")

        # 1. Pré-processamento com o scaler
        # O scaler espera um array 2D (mesmo que seja uma única amostra)
        # Converta para DataFrame se o seu scaler foi treinado com nomes de colunas
        # ou diretamente para array numpy se não.
        # Exemplo simples (adapte para sua necessidade):
        try:
            input_array = np.array(features_list).reshape(1, -1) # [[val1, val2, ...]]
            scaled_features = scaler.transform(input_array)
        except Exception as e_scale:
            print(f"Erro no scaling: {e_scale}")
            return jsonify({"error": f"Erro ao aplicar o scaler: {str(e_scale)}"}), 400
        
        print(f"Features escaladas: {scaled_features}")

        # 2. Predição com o modelo
        try:
            prediction_probabilities = model.predict(scaled_features)
            predicted_class_index = np.argmax(prediction_probabilities, axis=1)[0]
        except Exception as e_predict:
            print(f"Erro na predição: {e_predict}")
            return jsonify({"error": f"Erro ao fazer a predição: {str(e_predict)}"}), 400

        # Mapear o índice para uma classe legível (adapte conforme seu modelo)
        # Estas devem ser as mesmas classes e na mesma ordem usadas no treinamento
        class_names = ["Aereo Comercial", "Aereo Dedicado", "Terrestre"] # Exemplo! Adapte!
        
        if predicted_class_index < len(class_names):
            predicted_transport_mode = class_names[predicted_class_index]
        else:
            predicted_transport_mode = "Classe Desconhecida"
            print(f"Índice de classe previsto ({predicted_class_index}) fora do alcance de class_names.")


        return jsonify({
            "predicted_transport_mode": predicted_transport_mode,
            "predicted_class_index": int(predicted_class_index), # Converte para int padrão
            "probabilities": prediction_probabilities.tolist()[0]
        })

    except Exception as e:
        print(f"Erro inesperado durante a predição: {e}")
        return jsonify({"error": f"Erro interno inesperado no servidor: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    # debug=False é importante para produção com Gunicorn
    app.run(host='0.0.0.0', port=port, debug=False)
