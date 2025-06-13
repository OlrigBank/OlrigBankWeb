import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename


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

@app.route("/save", methods=["POST"])
@app.route("/save", methods=["POST"])
def save_changes():

    changes = request.json.get("changes", [])
    data = load_toml(DATA_FILE)


    # helper to generate next numeric string ID
    def next_id(items):
        # extract all existing numeric ids, pick max+1
        nums = [int(x["id"]) for x in items if "id" in x and str(x["id"]).isdigit()]
        return str(max(nums + [0]) + 1)


    for change in changes:
        typ = change.get("type")
        cid = change.get("id")
        parent = change.get("parent", None)

        if typ == "menu":
            menus = data.setdefault("menus", [])
            # try update by id
            target = next((m for m in menus if m.get("id") == cid), None)
            if target:
                # update text & parent
                target["text"] = change.get("text", target.get("text"))
                if parent is not None:
                    target["parent"] = parent
            else:
                # insert new menu with generated id if none provided
                new_id = cid or next_id(menus)
                new_menu = {
                    "id": new_id,
                    "menu": change.get("menu", ""),
                    "text": change.get("text", ""),
                }
                if parent:
                    new_menu["parent"] = parent
                menus.append(new_menu)

        elif typ == "offering":
            offs = data.setdefault("offerings", [])
            target = next((o for o in offs if o.get("id") == cid), None)
            if target:
                # update all provided fields
                for k, v in change.items():
                    if k not in ("type",):
                        target[k] = v
            else:
                # append new offering, generating id if needed
                new_id = cid or next_id(offs)
                new_off = {"id": new_id}
                for k in ("menu", "text", "link", "image", "parent"):
                    if k in change:
                        new_off[k] = change[k]
                offs.append(new_off)

    # write back
    # 4) Write back to site_structure.toml
    try:
        import toml as toml_write
        with open(DATA_FILE, "w") as f:
            toml_write.dump(data, f)
    except ImportError:
        return jsonify({"error": "toml library not available for writing"}), 500

    # 5) Return success
    return jsonify({"status": "ok"})

@app.route("/schemas/<path:filename>")
def serve_schema(filename):
    # serves files out of the `schemas/` folder next to app.py
    return send_from_directory(
        os.path.join(app.root_path, "schemas"),
        filename,
        mimetype="application/json"
    )

# where to stash uploads
PROJECT_ROOT  = os.path.abspath(os.path.join(os.path.dirname(__file__)))
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, "static", "images")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/upload", methods=["POST"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "no file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "no selected file"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "file type not allowed"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)

    # return the filename so the client can reference it
    return jsonify({"filename": filename})


if __name__ == "__main__":
    app.run(debug=True)
