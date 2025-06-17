from flask import Flask, render_template
VERSION = '0.0.26.3'

app = Flask(__name__, template_folder="../templates", static_folder="../static")

@app.route('/health')
def health():
    return 'OK', 200

@app.route('/')
def index():
    return render_template('home.html', title='Home', navigation='Home', version=VERSION)

import os, sys
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.serving import run_simple

# — find & load your handyman app.py as a module —
HANDY_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'handyman-offering-tree')
)
HANDY_APP_PATH = os.path.join(HANDY_DIR, 'app.py')

import importlib.util
spec = importlib.util.spec_from_file_location("handyman_app", HANDY_APP_PATH)
handy_mod = importlib.util.module_from_spec(spec)
sys.modules["handyman_app"] = handy_mod
spec.loader.exec_module(handy_mod)

# now grab the Flask instance from it
handyman_app = handy_mod.app

# your main app is still called `app` in this file
from server import app  # or however you import your main Flask app

# mount at /handyman
application = DispatcherMiddleware(app.wsgi_app, {
    '/handyman': handyman_app.wsgi_app
})

if __name__ == '__main__':
    run_simple(
        hostname='0.0.0.0',
        port=8080,
        application=application,
        use_reloader=True,
        use_debugger=True
    )
