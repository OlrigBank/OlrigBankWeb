import os
from site_structure import menus, offerings

TEMPLATE_DIR = "templates"
GENERATED_PARTIALS_DIR = os.path.join(TEMPLATE_DIR, "_partials", "_generated")
SERVER_DIR = "src"
SERVER_FILE = os.path.join(SERVER_DIR, "server.py")
HOME_TEMPLATE = os.path.join(TEMPLATE_DIR, "home.html")

VERSION = "0.0.25"  # Manual versioning

def slugify(title):
    return title.lower().replace(" ", "_").replace("'", "")

def build_menu_tree(menus):
    tree = {}
    for item in menus:
        parent = item["parent"]
        if parent not in tree:
            tree[parent] = []
        tree[parent].append(item)
    return tree

def validate_structure(menus):
    if not any(menu["menu"] == "Home" for menu in menus):
        raise ValueError("❌ site_structure.py must contain a 'Home' menu for root generation.")
    print("✅ Structure validated: Home menu present.")

def ensure_directories():
    os.makedirs(GENERATED_PARTIALS_DIR, exist_ok=True)
    os.makedirs(SERVER_DIR, exist_ok=True)
    os.makedirs(TEMPLATE_DIR, exist_ok=True)

    # Ensure app/init.py exists for Flask module recognition
    init_file = os.path.join(SERVER_DIR, '__init__.py')
    if not os.path.exists(init_file):
        with open(init_file, 'w') as f:
            f.write("# Init file for Flask app\n")
        print(f"✅ Created: {init_file}")

def generate_home_template():
    with open(HOME_TEMPLATE, "w") as f:
        f.write("""{% extends "_partials/_base.html" %}""")
    print(f"✅ Generated home.html")

def generate_generated_partials(menus, offerings):
    tree = build_menu_tree(menus)

    # Generate menu content
    menu_file = os.path.join(GENERATED_PARTIALS_DIR, "menu_content.html")
    with open(menu_file, "w") as f:
        f.write("<ul>\n")
        def write_menu_items(items, indent=2):
            for item in items:
                slug = slugify(item["menu"])
                f.write(" " * indent + f'<li><a href="#{slug}">{item["menu"]}</a>\n')
                if item["menu"] in tree:
                    f.write(" " * indent + "<ul>\n")
                    write_menu_items(tree[item["menu"]], indent + 2)
                    f.write(" " * indent + "</ul>\n")
                f.write(" " * indent + "</li>\n")
        write_menu_items(tree.get(None, []))
        f.write("</ul>\n")
    print(f"✅ Generated: {menu_file}")

    # Generate offerings content
    offerings_file = os.path.join(GENERATED_PARTIALS_DIR, "offerings_content.html")
    with open(offerings_file, "w") as f:
        for item in menus:
            slug = slugify(item["menu"])
            f.write(f'<div class="category-card" data-category="{slug}">\n')
            f.write(f'  <h2>{item["menu"]}</h2>\n')
            f.write(f'  <p>{item.get("description", "")}</p>\n')
            f.write('</div>\n')

            menu_offerings = [o for o in offerings if o["menu"] == item["menu"]]
            for offering in menu_offerings:
                image_path = f'images/{offering["image"]}.png'
                f.write('<div class="offering-card">\n')
                f.write(f'  <a href="{offering["link"]}" target="_blank">\n')
                f.write(f'    <img src="{image_path}" alt="{offering["text"]}">\n')
                f.write(f'    <p>{offering["text"]}</p>\n')
                f.write('  </a>\n')
                f.write('</div>\n')
    print(f"✅ Generated: {offerings_file}")

def generate_server():
    with open(SERVER_FILE, "w") as f:
        f.write("from flask import Flask, render_template\n")
        f.write("from site_structure import menus\n")
        f.write("from generate_site import build_menu_tree\n\n")
        f.write(f"VERSION = '{VERSION}'\n\n")
        f.write('app = Flask(__name__, template_folder="../templates", static_folder="../static")\n\n')
        f.write("tree = build_menu_tree(menus)\n")
        f.write("def build_menu(current_title):\n")
        f.write("    return ''  # Menu is pre-generated into partials\n\n")
        f.write("@app.route('/health')\n")
        f.write("def health():\n")
        f.write("    return 'OK', 200\n\n")
        f.write("@app.route('/')\n")
        f.write("def index():\n")
        f.write("    return render_template('home.html', title='Home', navigation=build_menu('Home'), version=VERSION)\n\n")
        f.write("if __name__ == '__main__':\n")
        f.write("    app.run(debug=True, host='0.0.0.0', port=8080)\n")
    print(f"✅ Generated: {SERVER_FILE}")

def main():
    print("🔧 Starting site generation...")
    ensure_directories()
    validate_structure(menus)
    generate_home_template()
    generate_generated_partials(menus, offerings)
    generate_server()
    print(f"🎉 Site generation complete! Version {VERSION}")

if __name__ == "__main__":
    main()
