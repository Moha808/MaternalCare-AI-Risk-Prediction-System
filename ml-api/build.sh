#!/bin/bash
# This script is run by Render during the build phase.
# It installs dependencies, then generates and trains the ML model.
set -e

pip install -r requirements.txt
python generate_data.py
python train_model.py
