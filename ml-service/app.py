from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "Olá do Flask app!"

# Não precisa do if __name__ == '__main__': para o Gunicorn
