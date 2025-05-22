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
INPUT_CSV_PATH = "synthetic_transport_data.csv" # Gerado pelo data_generator.py
MODEL_SAVE_DIR = "../model/" # Salvar na pasta model, um nível acima de training_scripts
MODEL_NAME = "organ_transport_model.h5"
SCALER_NAME = "scaler.joblib"
NUM_CLASSES = 3 # Terrestre, Aéreo Comercial, Aéreo Dedicado
TEST_SIZE = 0.2
RANDOM_STATE = 42

def treinar_modelo():
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

    # Converter y para one-hot encoding
    y_categorical = to_categorical(y, num_classes=NUM_CLASSES)

    # 3. Dividir em Treino e Teste
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_categorical, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y # stratify para classes desbalanceadas
    )

    # 4. Escalar Features Numéricas
    # Identificar colunas numéricas (todas neste caso, exceto as booleanas que já são 0 ou 1)
    # Se você tivesse colunas categóricas não numéricas, precisaria de OneHotEncoder ou similar
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
        Dense(NUM_CLASSES, activation='softmax') # Softmax para classificação multiclasse
    ])

    model.compile(optimizer='adam',
                  loss='categorical_crossentropy', # Para one-hot encoded labels
                  metrics=['accuracy'])

    model.summary()

    # 6. Treinar o Modelo
    print("\nIniciando treinamento do modelo...")
    history = model.fit(X_train_scaled, y_train,
                        epochs=50, # Aumente para melhor performance, mas mais tempo de treino
                        batch_size=32,
                        validation_split=0.15, # Usar parte dos dados de treino para validação
                        verbose=1) # 0=silencioso, 1=barra de progresso, 2=uma linha por época

    # 7. Avaliar o Modelo
    print("\nAvaliando o modelo nos dados de teste...")
    loss, accuracy = model.evaluate(X_test_scaled, y_test, verbose=0)
    print(f"Loss no Teste: {loss:.4f}")
    print(f"Acurácia no Teste: {accuracy:.4f}")

    # 8. Salvar o Modelo e o Scaler
    model_path = os.path.join(MODEL_SAVE_DIR, MODEL_NAME)
    scaler_path = os.path.join(MODEL_SAVE_DIR, SCALER_NAME)
    
    model.save(model_path)
    joblib.dump(scaler, scaler_path)

    print(f"\nModelo salvo em: {model_path}")
    print(f"Scaler salvo em: {scaler_path}")

if __name__ == "__main__":
    treinar_modelo()
