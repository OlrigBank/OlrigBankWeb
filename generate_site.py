import os
from site_structure import pages

TEMPLATE_DIR = "templates"
SERVER_FILE = "server.py"
BASE_TEMPLATE = os.path.join(TEMPLATE_DIR, "base.html")
HOME_TEMPLATE = os.path.join(TEMPLATE_DIR, "home.html")


def slugify(title):
    return title.lower().replace(" ", "_").replace("'", "")


def build_page_tree(pages):
    tree = {}
    for page in pages:
        parent = page["parent"]
        title = page["title"]

        if parent not in tree:
            tree[parent] = []
        tree[parent].append(page)

    return tree


def validate_structure(pages):
    if not any(page["title"] == "Home" for page in pages):
        raise ValueError("❌ site_structure.py must contain a 'Home' page for root route generation.")
    print("✅ Structure validated: Home page present.")


def generate_menu(tree, parent="Home", indent=4):
    if parent not in tree:
        return ""

    menu = " " * indent + "<ul>\n"
    for page in tree[parent]:
        slug = slugify(page["title"])
        route = "/" if page["parent"] == "Home" and slug == "home" else "/" + slug
        if page["parent"] != "Home" and slug != "home":
            route = "/" + slugify(page["parent"]) + "/" + slug

        menu += " " * (indent + 2) + f'<li><a href="{route}">{page["title"]}</a>\n'
        menu += generate_menu(tree, page["title"], indent + 4)
        menu += " " * (indent + 2) + "</li>\n"
    menu += " " * indent + "</ul>\n"
    return menu


def generate_base_html(menu_html):
    base_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Olrig Bank | {{% block title %}}Page Title{{% endblock %}}</title>
    <link rel="stylesheet" href="{{{{ url_for('static', filename='css/style.css') }}}}">
</head>
<body>
<nav>
{menu_html.strip()}
</nav>
<main>
    {{% block content %}}{{% endblock %}}
</main>
</body>
</html>
"""
    with open(BASE_TEMPLATE, "w") as f:
        f.write(base_html)
    print(f"✅ Generated base.html with menu")


def generate_home_template():
    with open(HOME_TEMPLATE, "w") as f:
        f.write("""{% extends "base.html" %}

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

    for page in tree[parent]:
        slug = slugify(page["title"])
        folder_path = os.path.join(TEMPLATE_DIR, slugify(parent)) if parent != "Home" else TEMPLATE_DIR
        os.makedirs(folder_path, exist_ok=True)

        template_filename = os.path.join(folder_path, f"{slug}.html")

        if not os.path.exists(template_filename):
            with open(template_filename, "w") as f:
                f.write(f"""{{% extends "base.html" %}}

{{% block title %}}{page['title']}{{% endblock %}}

{{% block content %}}
<h1>{page['title']}</h1>
<p>Content coming soon for {page['title']}.</p>
{{% endblock %}}
""")
            print(f"✅ Created template: {template_filename}")
        else:
            print(f"⏩ Template already exists: {template_filename}")

        # Recursive call for child pages
        generate_templates(tree, page["title"])


def generate_server(tree):
    with open(SERVER_FILE, "w") as f:
        f.write("from flask import Flask, render_template\n\n")
        f.write("app = Flask(__name__)\n\n")

        # Health check route
        f.write("@app.route('/health')\n")
        f.write("def health():\n")
        f.write("    return 'OK', 200\n\n")

        # Home route
        f.write("@app.route('/')\n")
        f.write("def home():\n")
        f.write("    return render_template('home.html', title='Home')\n\n")

        def write_route(page):
            slug = slugify(page["title"])
            function_name = slug
            route = "/" if page["parent"] == "Home" and slug == "home" else "/" + slug
            if page["parent"] != "Home" and slug != "home":
                route = "/" + slugify(page["parent"]) + "/" + slug

            template_path = f"{slugify(page['parent'])}/{slug}.html" if page["parent"] != "Home" else f"{slug}.html"

            f.write(f"@app.route('{route}')\n")
            f.write(f"def {function_name}():\n")
            f.write(f"    return render_template('{template_path}', title=\"{page['title']}\")\n\n")

            # Recurse for child pages
            if page["title"] in tree:
                for child in tree[page["title"]]:
                    write_route(child)

        # Generate routes for pages under Home
        if "Home" in tree:
            for page in tree["Home"]:
                write_route(page)

        f.write("\nif __name__ == '__main__':\n")
        f.write("    app.run(debug=True, host='0.0.0.0', port=8080)\n")

    print(f"✅ Generated server.py with routes")


def main():
    print("🔧 Starting site generation...")

    validate_structure(pages)

    tree = build_page_tree(pages)

    menu_html = generate_menu(tree)
    generate_base_html(menu_html)
    generate_home_template()
    generate_templates(tree)
    generate_server(tree)

    print("🎉 Site generation complete!")


if __name__ == "__main__":
    main()
