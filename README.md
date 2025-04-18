# OlrigBankWeb

This README shows how to run the site “bare‑metal” (without Docker) from anywhere on your machine.

## Prerequisites

- Python 3.11 or newer
- `pip`
- (Optional) `venv` for isolated environments

## 1. Setup environment & install dependencies

### macOS / Linux

```bash
python3 -m venv .venv        # create virtual environment
source .venv/bin/activate    # activate it
python3 -m pip install --upgrade pip
pip install -r requirements.txt
```

### Windows (PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Windows (Command Prompt)

```cmd
python -m venv .venv
.\.venv\Scripts\activate.bat  # activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Windows (Git Bash)

On Git Bash, the virtual‑env activation script lives under `Scripts` rather than `bin`:

```bash
python -m venv .venv
source .venv/Scripts/activate    # activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 2. Verifying Flask Installation

After installing your dependencies (and with your virtual environment activated), confirm Flask is installed and check its version in two ways:

1. **Using the `flask` CLI:**
   ```bash
   flask --version
   ```
   This prints the Flask version and Werkzeug version.

2. **Using Python directly:**
   ```bash
   python -c "import flask; print(flask.__version__)"
   ```

## 3. Generate the site

```bash
python generate_site.py
```

## 4. Run the server

### Option A: Direct with Python

```bash
python src/server.py
```

### Option B: Using the Flask CLI

#### macOS / Linux
```bash
export FLASK_APP="$(pwd)/src/server.py"
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=8080
```

#### Windows (PowerShell)
```powershell
$env:FLASK_APP = (Resolve-Path src\server.py)
$env:FLASK_ENV = 'development'
flask run --host=0.0.0.0 --port=8080
```

#### Windows (Command Prompt)
```cmd
set FLASK_APP=src\server.py
set FLASK_ENV=development
flask run --host=0.0.0.0 --port=8080
```

## (Optional) Helper scripts

You can create these at your project root to simplify commands:

### setup.sh (macOS / Linux)
```bash
#!/usr/bin/env bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
pip install -r requirements.txt
```

### setup.ps1 (Windows PowerShell)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### generate.sh
```bash
#!/usr/bin/env bash
python generate_site.py
```

### run.sh
```bash
#!/usr/bin/env bash
python src/server.py
```

Make Unix scripts executable:
```bash
chmod +x setup.sh generate.sh run.sh
```

Then run:
```bash
# macOS / Linux
./setup.sh
./generate.sh
./run.sh

# Windows PowerShell
./setup.ps1; ./generate.sh; ./run.sh

# Windows Git Bash
./setup.sh
./generate.sh
./run.sh
```

