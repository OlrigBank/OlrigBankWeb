from flask import Flask, render_template
VERSION = '0.0.26.3'

app = Flask(__name__, template_folder="../templates", static_folder="../static")

@app.route('/health')
def health():
    return 'OK', 200

@app.route('/')
def index():
    return render_template('home.html', title='Home', navigation='Home', version=VERSION)

# ——————————————————————————————————————————————————————————————————————
# Mount the handyman-offering-tree app at /handyman and serve all on :8080
# ——————————————————————————————————————————————————————————————————————
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.serving import run_simple
import os, sys

# Ensure Python can import the handyman app (handyman-offering-tree is a sibling of src)
HANDY_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'handyman_offering_tree')
)
sys.path.insert(0, HANDY_PATH)

# Import the Flask instance from your handyman app.py
from handyman_offering_tree.app import app as handyman_app

# Compose main site + handyman under /handyman
application = DispatcherMiddleware(app.wsgi_app, {
    '/handyman': handyman_app.wsgi_app
})

if __name__ == '__main__':
    # This runs BOTH apps on 0.0.0.0:8080
    # Main site at  http://<host>:8080/
    # Handyman UI at http://<host>:8080/handyman/
    run_simple(
        hostname='0.0.0.0',
        port=8080,
        application=application,
        use_reloader=True,
        use_debugger=True
    )