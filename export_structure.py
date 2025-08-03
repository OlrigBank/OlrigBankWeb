import tomllib
import json
import os

# Define paths
HERE = os.path.abspath(os.path.dirname(__file__))
TOML_PATH = os.path.join(HERE, "site_structure.toml")
JSON_PATH = os.path.join(HERE, "static", "data", "structure.json")

# Load site_structure.toml
with open("site_structure.toml","rb") as f:
    data = tomllib.load(f)

# Ensure output directory exists
os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)

# Save as JSON
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Exported structure to {JSON_PATH}")
