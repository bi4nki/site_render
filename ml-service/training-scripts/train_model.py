import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout # Input
from tensorflow.keras.utils import to_categorical
import joblib
import os

# --- Parâmetros de Treinamento ---
INPUT_CSV_PATH = "synthetic_transport_data_v2.csv" # Usar o novo CSV
MODEL_SAVE_DIR = "../model/" 
MODEL_NAME_H5 = "organ_transport_model_v2.h5" # Novo nome para o modelo Keras
SCALER_NAME_V2 = "scaler_v2.joblib" # Novo nome para o scaler
TFLITE_MODEL_NAME_V2 = 'organ_transport_model_v2.tflite' # Novo nome para TFLite
NUM_CLASSES = 3 
NUM_FEATURES = 6 # ATUALIZADO: distancia, isquemia, urgencia, disp_comercial, horario_comercial, disp_dedicado
TEST_SIZE = 0.2
RANDOM_STATE = 42

def treinar_modelo():
    # ... (criar MODEL_SAVE_DIR se não existir) ...
    if not os.path.exists(MODEL_SAVE_DIR):
        os.makedirs(MODEL_SAVE_DIR)

    try:
        df = pd.read_csv(INPUT_CSV_PATH)
    except FileNotFoundError: # ... (erro como antes) ...
        return
    print(f"Dados carregados: {df.shape[0]} amostras, {df.shape[1]} colunas.")
    if df.shape[1] != NUM_FEATURES + 1: # +1 para a coluna target 'melhor_modal'
        print(f"ERRO: Número de colunas no CSV ({df.shape[1]-1} features) não corresponde ao esperado ({NUM_FEATURES} features).")
        print(f"Colunas encontradas: {list(df.columns)}")
        return


    X = df.drop("melhor_modal", axis=1)
    y = df["melhor_modal"]
    y_categorical = to_categorical(y, num_classes=NUM_CLASSES)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_categorical, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Reconstruir o modelo com a input_shape correta para NUM_FEATURES
    model = Sequential([
        # tf.keras.layers.Input(shape=(NUM_FEATURES,)), # Maneira recomendada
        Dense(128, activation='relu', input_shape=(NUM_FEATURES,)), # Ou manter assim
        Dropout(0.3),
        Dense(64, activation='relu'),
        Dropout(0.3),
        Dense(32, activation='relu'),
        Dense(NUM_CLASSES, activation='softmax')
    ])
    # ... (compile, summary, fit, evaluate como antes) ...
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    model.summary()
    print("\nIniciando treinamento do modelo V2...")
    model.fit(X_train_scaled, y_train, epochs=50, batch_size=32, validation_split=0.15, verbose=1)
    loss, accuracy = model.evaluate(X_test_scaled, y_test, verbose=0)
    print(f"Loss no Teste V2: {loss:.4f}, Acurácia no Teste V2: {accuracy:.4f}")

    model_path_h5 = os.path.join(MODEL_SAVE_DIR, MODEL_NAME_H5)
    scaler_path_v2 = os.path.join(MODEL_SAVE_DIR, SCALER_NAME_V2)
    model.save(model_path_h5)
    joblib.dump(scaler, scaler_path_v2)
    print(f"\nModelo Keras V2 salvo em: {model_path_h5}")
    print(f"Scaler V2 salvo em: {scaler_path_v2}")

    # Conversão para TFLite
    print("\nConvertendo modelo Keras V2 para TensorFlow Lite...")
    try:
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        tflite_model_content = converter.convert()
        tflite_model_path_v2 = os.path.join(MODEL_SAVE_DIR, TFLITE_MODEL_NAME_V2)
        with open(tflite_model_path_v2, 'wb') as f:
            f.write(tflite_model_content)
        print(f"Modelo TensorFlow Lite V2 salvo em: {tflite_model_path_v2}")
    except Exception as e_tflite:
        print(f"ERRO durante a conversão para TensorFlow Lite V2: {e_tflite}")

if __name__ == "__main__":
    treinar_modelo()
