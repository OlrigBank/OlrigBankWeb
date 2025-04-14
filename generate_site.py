import os
from site_structure import menus, offerings

VERSION = "0.0.24"
TEMPLATE_DIR = "templates"
PARTIALS_DIR = os.path.join(TEMPLATE_DIR, "_partials")
GENERATED_PARTIALS_DIR = os.path.join(TEMPLATE_DIR, "generated")
SERVER_DIR = "src"
SERVER_FILE = os.path.join(SERVER_DIR, "server.py")
HOME_TEMPLATE = os.path.join(TEMPLATE_DIR, "home.html")

def url_for_static_image(image_name):
    return f"/static/images/{image_name}.png"

def slugify(text):
    return text.lower().replace(" ", "_").replace("'", "")


def build_page_tree(menus):
    tree = {}
    for menu in menus:
        parent = menu["parent"]
        title = menu["menu"]

        if parent not in tree:
            tree[parent] = []
        tree[parent].append(menu)

    return tree


def validate_structure(menus):
    if not any(menu["menu"] == "Home" for menu in menus):
        raise ValueError("❌ site_structure.py must contain a 'Home' menu for root route generation.")
    print("✅ Structure validated: Home menu present.")


def ensure_directories():
    for directory in [SERVER_DIR, TEMPLATE_DIR, PARTIALS_DIR, GENERATED_PARTIALS_DIR]:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"✅ Created missing directory: {directory}")

    # Ensure __init__.py exists in src/
    init_file = os.path.join(SERVER_DIR, "__init__.py")
    if not os.path.exists(init_file):
        with open(init_file, "w") as f:
            f.write("# This file makes src a Python package.\n")
            print(f"✅ Created: {init_file}")

def generate_menu(tree, parent=None, indent=0):
    if parent not in tree:
        return ""

    menu = " " * indent + "<ul>\n"
    for item in tree[parent]:
        slug = slugify(item["menu"])
        menu += " " * (indent + 2) + f'<li><a href="#{slug}">{item["menu"]}</a>\n'
        # Recursive call for child items
        if item["menu"] in tree:
            menu += generate_menu(tree, parent=item["menu"], indent=indent + 4)
            menu += " " * (indent + 2) + "</li>\n"

    menu += " " * indent + "</ul>\n"
    return menu


def generate_home_template():
    with open(HOME_TEMPLATE, "w") as f:
        f.write("""{% extends "_partials/_base.html" %}
""")
    print(f"✅ Generated home.html")


def generate_server(tree, version):
    with open(SERVER_FILE, "w") as f:
        f.write("from flask import Flask, render_template\n")
        f.write("from site_structure import menus, offerings\n")
        f.write("from generate_site import build_page_tree, generate_menu\n\n")
        f.write(f"VERSION = '{version}'\n\n")
        f.write("app = Flask(__name__, template_folder=\"../templates\", static_folder=\"../static\")\n\n")
        f.write("tree = build_page_tree(menus)\n\n")
        f.write("def build_menu(current_title):\n")
        f.write("    return generate_menu(tree)\n\n")

        # Health check route
        f.write("@app.route('/health')\n")
        f.write("def health():\n")
        f.write("    return 'OK', 200\n\n")

        # Single index route only!
        f.write("@app.route('/')\n")
        f.write("def index():\n")
        f.write("    return render_template('home.html', title='Home', navigation=build_menu('Home'), version=VERSION)\n\n")

        # No need to generate individual routes anymore! ✅

        f.write("\nif __name__ == '__main__':\n")
        f.write("    app.run(debug=True, host='0.0.0.0', port=8080)\n")

    print(f"✅ Generated server.py with version {version}")



def generate_offerings(tree, offerings):
    offerings_file = os.path.join(GENERATED_PARTIALS_DIR, "offerings_content.html")
    with open(offerings_file, "w") as f:
        def write_offerings(menu_item):
            slug = slugify(menu_item["menu"])
            f.write(f'<div class="category-card" data-category="{slug}">\n')
            f.write(f'  <h2>{menu_item["menu"]}</h2>\n')
            f.write(f'  <p>{menu_item.get("text", "Explore our local recommendations!")}</p>\n')
            f.write('</div>\n')

            menu_offerings = [o for o in offerings if o["menu"] == menu_item["menu"]]
            for offering in menu_offerings:
                image_path = url_for_static_image(offering["image"])
                f.write('<div class="offering-card">\n')
                f.write(f'  <a href="{offering["link"]}" target="_blank">\n')
                f.write(f'    <img src="{image_path}" alt="{offering["text"]}">\n')
                f.write(f'    <p>{offering["text"]}</p>\n')
                f.write('  </a>\n')
                f.write('</div>\n')

            # Now write children
            if menu_item["menu"] in tree:
                for child in tree[menu_item["menu"]]:
                    write_offerings(child)

        # Start from the root menus
        if "Home" in tree:
            for menu_item in tree["Home"]:
                write_offerings(menu_item)

    print(f"✅ Generated: {offerings_file}")





def main():
    print("🔧 Starting site generation...")
    os.makedirs(SERVER_DIR, exist_ok=True)
    ensure_directories()
    validate_structure(menus)

    tree = build_page_tree(menus)

    generate_home_template()
    generate_server(tree, VERSION)
    generate_offerings(tree, offerings)

    print("🎉 Site generation complete!")


if __name__ == "__main__":
    main()
