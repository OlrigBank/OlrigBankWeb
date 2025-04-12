import os
from site_structure import menus, offerings

TEMPLATE_DIR = "templates"
PARTIALS_DIR = os.path.join(TEMPLATE_DIR, "_partials")
GENERATED_PARTIALS_DIR = os.path.join(TEMPLATE_DIR, "generated")
SERVER_FILE = "server.py"
HOME_TEMPLATE = os.path.join(TEMPLATE_DIR, "home.html")


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
    for directory in [TEMPLATE_DIR, PARTIALS_DIR, GENERATED_PARTIALS_DIR]:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"✅ Created missing directory: {directory}")


def generate_menu(tree, parent="Home", current_title="", indent=4):
    if parent not in tree:
        return ""

    menu = " " * indent + "<ul>\n"
    for item in tree[parent]:
        slug = slugify(item["menu"])
        route = "/" if item["parent"] == "Home" and slug == "home" else "/" + slug
        if item["parent"] != "Home" and slug != "home":
            route = "/" + slugify(item["parent"]) + "/" + slug

        active_class = "active" if item["menu"] == current_title else ""

        menu += " " * (indent + 2) + f'<li><a href="{route}" class="{active_class}">{item["menu"]}</a>\n'
        menu += generate_menu(tree, item["menu"], current_title=current_title, indent=indent + 4)
        menu += " " * (indent + 2) + "</li>\n"
    menu += " " * indent + "</ul>\n"
    return menu


def generate_home_template():
    with open(HOME_TEMPLATE, "w") as f:
        f.write("""{% extends "_partials/_base.html" %}

{% block title %}Home{% endblock %}

{% block content %}
<h1>Welcome to Olrig Bank</h1>
<p>This is the home page. Use the menu to navigate.</p>
{% endblock %}
""")
    print(f"✅ Generated home.html")


def generate_templates(tree, parent="Home"):
    if parent not in tree:
        return

    for item in tree[parent]:
        slug = slugify(item["menu"])
        folder_path = os.path.join(TEMPLATE_DIR, slugify(parent)) if parent != "Home" else TEMPLATE_DIR
        os.makedirs(folder_path, exist_ok=True)

        template_filename = os.path.join(folder_path, f"{slug}.html")

        # Safeguard: only create if not existing (no overwrite!)
        if not os.path.exists(template_filename):
            with open(template_filename, "w") as f:
                f.write(f"""{{% extends "_partials/_base.html" %}}

{{% block title %}}{item['menu']}{{% endblock %}}

{{% block content %}}
<h1>{item['menu']}</h1>
<p>Content coming soon for {item['menu']}.</p>
{{% endblock %}}
""")
            print(f"✅ Created template: {template_filename}")
        else:
            print(f"⏩ Template already exists: {template_filename}")

        # Recursive for child pages
        generate_templates(tree, item["menu"])


def generate_server(tree):
    with open(SERVER_FILE, "w") as f:
        f.write("from flask import Flask, render_template\n")
        f.write("from site_structure import menus\n")
        f.write("from generate_site import build_page_tree, generate_menu\n\n")
        f.write("app = Flask(__name__)\n\n")
        f.write("tree = build_page_tree(menus)\n")
        f.write("def build_menu(current_title):\n")
        f.write("    return generate_menu(tree, current_title=current_title)\n\n")

        # Health check route
        f.write("@app.route('/health')\n")
        f.write("def health():\n")
        f.write("    return 'OK', 200\n\n")

        # Home route
        f.write("@app.route('/')\n")
        f.write("def home():\n")
        f.write("    return render_template('home.html', title='Home', navigation=build_menu('Home'))\n\n")

        def write_route(item):
            slug = slugify(item["menu"])
            route = "/" if item["parent"] == "Home" and slug == "home" else "/" + slug
            if item["parent"] != "Home" and slug != "home":
                route = "/" + slugify(item["parent"]) + "/" + slug

            template_path = f"{slugify(item['parent'])}/{slug}.html" if item["parent"] != "Home" else f"{slug}.html"

            f.write(f"@app.route('{route}')\n")
            f.write(f"def {slug}():\n")
            f.write(f"    return render_template('{template_path}', title=\"{item['menu']}\", navigation=build_menu(\"{item['menu']}\"))\n\n")

            # Recursion
            if item["menu"] in tree:
                for child in tree[item["menu"]]:
                    write_route(child)

        if "Home" in tree:
            for item in tree["Home"]:
                write_route(item)

        f.write("\nif __name__ == '__main__':\n")
        f.write("    app.run(debug=True, host='0.0.0.0', port=8080)\n")

    print(f"✅ Generated server.py with routes")


def generate_generated_partials(menus, offerings):
    os.makedirs(GENERATED_PARTIALS_DIR, exist_ok=True)

    # Menu partial
    menu_file = os.path.join(GENERATED_PARTIALS_DIR, "menu_content.html")
    with open(menu_file, "w") as f:
        f.write("<ul>\n")
        for menu in menus:
            slug = slugify(menu["menu"])
            f.write(f'  <li><a href="#{slug}">{menu["menu"]}</a></li>\n')
        f.write("</ul>\n")
    print(f"✅ Generated: {menu_file}")

    # Offerings partial
    offerings_file = os.path.join(GENERATED_PARTIALS_DIR, "offerings_content.html")
    with open(offerings_file, "w") as f:
        for menu in menus:
            slug = slugify(menu["menu"])
            f.write(f'<div class="category-card" data-category="{slug}">{menu["menu"]}</div>\n')

            menu_offerings = [o for o in offerings if o["menu"] == menu["menu"]]
            if menu_offerings:
                for offering in menu_offerings:
                    image_path = f'images/{offering["image"]}.png'
                    f.write('<div class="offering-card">\n')
                    f.write(f'  <a href="{offering["link"]}" target="_blank">\n')
                    f.write(f'    <img src="{image_path}" alt="{offering["text"]}">\n')
                    f.write(f'    <p>{offering["text"]}</p>\n')
                    f.write('  </a>\n')
                    f.write('</div>\n')
    print(f"✅ Generated: {offerings_file}")


def main():
    print("🔧 Starting site generation...")

    ensure_directories()
    validate_structure(menus)

    tree = build_page_tree(menus)

    generate_home_template()
    generate_templates(tree)
    generate_server(tree)
    generate_generated_partials(menus, offerings)

    print("🎉 Site generation complete!")


if __name__ == "__main__":
    main()
