from flask import Flask, render_template, request, jsonify, send_from_directory
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

@app.route("/save", methods=["POST"])
def save_changes():
    # 1) Read incoming JSON payload
    changes = request.json.get("changes", [])

    # 2) Load existing TOML data
    data = load_toml(DATA_FILE)

    # 3) Apply each change
    for change in changes:
        typ = change.get("type")
        key_menu = change.get("menu")
        new_text = change.get("text", "")
        parent = change.get("parent", None)

        if typ == "menu":
            # Try to update an existing menu...
            found = False
            for m in data.setdefault("menus", []):
                if m.get("menu") == key_menu:
                    m["text"] = new_text
                    if parent is not None:
                        m["parent"] = parent
                    found = True
                    break

            # …or insert it if missing
            if not found:
                new_menu = {"menu": key_menu, "text": new_text}
                if parent:
                    new_menu["parent"] = parent
                data["menus"].append(new_menu)

        elif typ == "offering":
            # Similar “upsert” logic for offerings
            found = False
            for o in data.setdefault("offerings", []):
                # you may need a better key here if offerings can repeat text
                if o.get("menu") == key_menu and o.get("text") == change.get("old_text", o.get("text")):
                    # update existing
                    for k in ("text", "link", "image"):
                        if k in change:
                            o[k] = change[k]
                    found = True
                    break

            if not found:
                # append a brand‐new offering
                new_off = {
                    "menu": change["menu"],
                    "text": change.get("text", ""),
                }
                if "link" in change: new_off["link"] = change["link"]
                if "image" in change: new_off["image"] = change["image"]
                data["offerings"].append(new_off)

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

if __name__ == "__main__":
    app.run(debug=True)
