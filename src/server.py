from flask import Flask, render_template

# Create app, pointing at your existing templates & static folders
app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static"
)

@app.route("/")
def mobile():
    return render_template("mobile.html")

# make the WSGI callable visible as "application"
application = app

if __name__ == "__main__":
    # Listen on all interfaces so you can hit it from any LAN device
    app.run(host="0.0.0.0", port=8080, debug=True)
