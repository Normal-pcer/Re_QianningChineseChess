from flask import Flask
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# launch index.html
app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def send_file(path):
    return app.send_static_file(path)


if __name__ == '__main__':
    port = 1919
    app.run(port=port, debug=True)