# debug_menu.py

from generate_site import build_menu_tree
import pprint

# Load menus from site_structure.toml
try:
    import tomllib
    def load_toml(filename):
        with open(filename, "rb") as f:
            return tomllib.load(f)
except ModuleNotFoundError:
    import toml
    def load_toml(filename):
        with open(filename, "r") as f:
            return toml.load(f)

data = load_toml("site_structure.toml")
menus = data["menus"]

# Show menu tree
pprint.pprint(build_menu_tree(menus))

