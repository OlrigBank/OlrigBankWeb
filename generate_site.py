import os
import sys

# Use tomllib if available (Python 3.11+), otherwise try toml package
try:
    import tomllib
    def load_toml(filename):
        with open(filename, "rb") as f:
            return tomllib.load(f)
except ModuleNotFoundError:
    try:
        import toml
        def load_toml(filename):
            with open(filename, "r") as f:
                return toml.load(f)
    except ImportError:
        print("❌ Please install toml (pip install toml) or use Python 3.11+")
        sys.exit(1)

# Load data from TOML file
data = load_toml("site_structure.toml")
menus = data["menus"]
offerings = data["offerings"]

VERSION = "0.0.26.3"
TEMPLATE_DIR = "templates"
PARTIALS_DIR = os.path.join(TEMPLATE_DIR, "_partials")
GENERATED_PARTIALS_DIR = os.path.join(TEMPLATE_DIR, "generated")
SERVER_DIR = "src"
SERVER_FILE = os.path.join(SERVER_DIR, "server.py")
HOME_TEMPLATE = os.path.join(TEMPLATE_DIR, "home.html")


def slugify(text):
    return text.lower().replace(" ", "_").replace("'", "")


def build_menu_tree(menus):
    tree = {}
    for menu in menus:
        parent = menu.get("parent") or ""
        title = menu["menu"]
        if parent not in tree:
            tree[parent] = []
        tree[parent].append(menu)
    return tree


def validate_structure(menus):
    if not any(menu["menu"] == "Home" for menu in menus):
        raise ValueError("❌ site_structure.toml must contain a 'Home' menu for root route generation.")
    print("✅ Structure validated: Home menu present.")


def ensure_directories():
    for directory in [SERVER_DIR, TEMPLATE_DIR, PARTIALS_DIR, GENERATED_PARTIALS_DIR]:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"✅ Created missing directory: {directory}")

    init_file = os.path.join(SERVER_DIR, "__init__.py")
    if not os.path.exists(init_file):
        with open(init_file, "w") as f:
            f.write("# This file makes src a Python package.\n")
        print(f"✅ Created: {init_file}")


def generate_home_template():
    with open(HOME_TEMPLATE, "w") as f:
        f.write("""{% extends "_partials/_base.html" %}""")
    print(f"✅ Generated home.html")


def generate_generated_partials(menus, offerings):
    tree = build_menu_tree(menus)

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

        write_menu_items(tree.get("", []))
        f.write("</ul>\n")
    print(f"✅ Generated: {menu_file}")

    offerings_file = os.path.join(GENERATED_PARTIALS_DIR, "offerings_content.html")
    with open(offerings_file, "w") as f:
        for item in menus:
            slug = slugify(item["menu"])
            f.write(f'<div class="category-card" data-category="{slug}">\n')
            f.write(f'  <h2>{item["menu"]}</h2>\n')
            f.write(f'  <p>{item.get("text", "")}</p>\n')
            f.write('</div>\n')

            menu_offerings = [o for o in offerings if o["menu"] == item["menu"]]
            for offering in menu_offerings:
                image_path = f'static/images/{offering["image"]}.png'
                f.write(f'<div class="offering-card">\n')
                f.write(f'  <a href="{offering["link"]}" target="_blank">\n')
                f.write(f'    <img src="{image_path}" alt="{offering["text"]}">\n')
                f.write('  </a>\n')
                f.write(f'  <p>{offering["text"]}</p>\n')
                f.write('</div>\n')
    print(f"✅ Generated: {offerings_file}")


def main():
    print("🔧 Starting site generation...")
    ensure_directories()
    validate_structure(menus)
    generate_home_template()
    generate_generated_partials(menus, offerings)
    print(f"🎉 Site generation complete! Version {VERSION}")


if __name__ == "__main__":
    main()
