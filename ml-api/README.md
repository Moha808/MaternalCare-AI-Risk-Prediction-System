# Maternal Health Risk Prediction API (ml-api)

This is the machine learning API for the Maternal Health Risk Prediction System. It is built using Python, Flask, Pandas, and Scikit-Learn.

## Requirements
- Python 3.8 or higher

## Setup Instructions

1. **Create and Activate a Virtual Environment:**
   ```bash
   # In Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   
   # In macOS/Linux (Bash)
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Generate Synthetic Dataset:**
   Generate the `maternal_health_risk.csv` dataset in `data/`:
   ```bash
   python generate_data.py
   ```

4. **Train and Compare Models:**
   Train the classifiers (Random Forest, Gradient Boosting, SVM), print comparison metrics, and save the best model and scaler:
   ```bash
   python train_model.py
   ```
   This will generate:
   - `model.pkl` (serialized best model)
   - `scaler.pkl` (serialized StandardScaler)
   - `metrics_report.json` (comparison report)

5. **Start Flask Server:**
   ```bash
   python app.py
   ```
   The server will start on `http://localhost:5000`.

## API Endpoints

### 1. Health Check
- **Endpoint:** `GET /health`
- **Response:**
  ```json
  {
    "status": "ok"
  }
  ```

### 2. Predict Risk Level
- **Endpoint:** `POST /predict`
- **Request Body (JSON):**
  ```json
  {
    "age": 25,
    "systolicBP": 120,
    "diastolicBP": 80,
    "bs": 7.0,
    "bodyTemp": 98.6,
    "heartRate": 72
  }
  ```
- **Response:**
  ```json
  {
    "riskLevel": "low risk",
    "confidence": 0.94,
    "probabilities": {
      "low risk": 0.94,
      "mid risk": 0.05,
      "high risk": 0.01
    }
  }
  ```
- **Range Constraints:**
  - `age`: 10 to 70
  - `systolicBP`: 70 to 180 mmHg
  - `diastolicBP`: 50 to 120 mmHg
  - `bs`: 6.0 to 20.0 mmol/L
  - `bodyTemp`: 95.0 to 105.0 F
  - `heartRate`: 40 to 140 bpm
