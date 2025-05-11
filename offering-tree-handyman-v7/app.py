from flask import Flask, render_template, request, jsonify
import os

try:
    import tomllib
    def load_toml(file):
        with open(file, "rb") as f:
            return tomllib.load(f)
except ImportError:
    import toml
    def load_toml(file):
        with open(file, "r") as f:
            return toml.load(f)

app = Flask(__name__)
DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../site_structure.toml"))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/load", methods=["GET"])
def load_data():
    data = load_toml(DATA_FILE)
    return jsonify(data)

@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store"
    return response

if __name__ == "__main__":
    app.run(debug=True)
