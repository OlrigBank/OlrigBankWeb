#!/usr/bin/env bash
python -m venv .venv
source .venv/Scripts/activate    # activate
python -m pip install --upgrade pip
pip install -r requirements.txt