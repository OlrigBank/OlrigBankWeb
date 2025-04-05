from flask import Flask, render_template

app = Flask(__name__)

# Standard
@app.route('/')
def index():
    return render_template("index.html")

@app.route('/health')
def health():
    return "OK", 200

# Content
@app.route('/whats-on')
def whats_on():
    return render_template("whats_on.html")

@app.route('/local-attractions')
def local_attractions():
    return render_template("local_attractions.html")

@app.route('/eating-out')
def eating_out():
    return render_template("eating_out.html")

@app.route('/local-walks')
def local_walks():
    return render_template("local_walks.html")

if __name__ == '__main__':
    app.run(debug=True)

