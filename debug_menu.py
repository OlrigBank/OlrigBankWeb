# debug_menu.py
from generate_site import build_menu_tree
from site_structure import menus
import pprint

pprint.pprint(build_menu_tree(menus))
