import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.utils import to_categorical
import joblib
import os

# --- Parâmetros de Treinamento ---
INPUT_CSV_PATH = "synthetic_transport_data.csv"
MODEL_SAVE_DIR = "../model/" 
MODEL_NAME = "organ_transport_model.h5"
SCALER_NAME = "scaler.joblib"
TFLITE_MODEL_NAME = 'organ_transport_model.tflite' # Nome do arquivo TFLite
NUM_CLASSES = 3 
TEST_SIZE = 0.2
RANDOM_STATE = 42

def treinar_modelo(): # A função começa aqui
    # Criar diretório para salvar modelo se não existir
    if not os.path.exists(MODEL_SAVE_DIR):
        os.makedirs(MODEL_SAVE_DIR)

    # 1. Carregar Dados
    try:
        df = pd.read_csv(INPUT_CSV_PATH)
    except FileNotFoundError:
        print(f"ERRO: Arquivo de dados '{INPUT_CSV_PATH}' não encontrado. Execute data_generator.py primeiro.")
        return

    print(f"Dados carregados: {df.shape[0]} amostras.")

    # 2. Preparar Features (X) e Target (y)
    X = df.drop("melhor_modal", axis=1)
    y = df["melhor_modal"]
    y_categorical = to_categorical(y, num_classes=NUM_CLASSES)

    # 3. Dividir em Treino e Teste
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_categorical, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    # 4. Escalar Features Numéricas
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 5. Construir o Modelo de Rede Neural
    model = Sequential([
        Dense(128, activation='relu', input_shape=(X_train_scaled.shape[1],)),
        Dropout(0.3),
        Dense(64, activation='relu'),
        Dropout(0.3),
        Dense(32, activation='relu'),
        Dense(NUM_CLASSES, activation='softmax')
    ])

    model.compile(optimizer='adam',
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
    model.summary()

    # 6. Treinar o Modelo
    print("\nIniciando treinamento do modelo...")
    history = model.fit(X_train_scaled, y_train,
                        epochs=50,
                        batch_size=32,
                        validation_split=0.15,
                        verbose=1)

    # 7. Avaliar o Modelo
    print("\nAvaliando o modelo nos dados de teste...")
    loss, accuracy = model.evaluate(X_test_scaled, y_test, verbose=0)
    print(f"Loss no Teste: {loss:.4f}")
    print(f"Acurácia no Teste: {accuracy:.4f}")

    # 8. Salvar o Modelo Keras (.h5) e o Scaler (.joblib)
    model_path = os.path.join(MODEL_SAVE_DIR, MODEL_NAME)
    scaler_path = os.path.join(MODEL_SAVE_DIR, SCALER_NAME) # scaler_path é definido aqui
    
    model.save(model_path)
    joblib.dump(scaler, scaler_path)

    print(f"\nModelo Keras salvo em: {model_path}")
    print(f"Scaler salvo em: {scaler_path}") # Agora este print está no escopo correto

    # --- Adicionar Conversão para TensorFlow Lite ---
    # ESTE BLOCO DEVE ESTAR DENTRO DA FUNÇÃO treinar_modelo()
    print("\nConvertendo modelo Keras para TensorFlow Lite...")
    try:
        # 'model' é a variável do seu modelo Keras treinado
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        tflite_model_content = converter.convert()

        tflite_model_path = os.path.join(MODEL_SAVE_DIR, TFLITE_MODEL_NAME)
        
        with open(tflite_model_path, 'wb') as f:
            f.write(tflite_model_content)
        print(f"Modelo TensorFlow Lite salvo em: {tflite_model_path}")
        print("Conversão para TFLite concluída com sucesso.")

    except Exception as e_tflite:
        print(f"ERRO durante a conversão para TensorFlow Lite: {e_tflite}")
    # --- Fim da Conversão para TensorFlow Lite ---

# A função treinar_modelo() termina aqui

if __name__ == "__main__":
    treinar_modelo() # Chamada da função
