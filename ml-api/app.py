from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)

# CORS: Allow the frontend origin (set CORS_ORIGIN env var in production, defaults to all)
allowed_origins = os.environ.get("CORS_ORIGIN", "*")
if allowed_origins != "*":
    allowed_origins = [o.strip() for o in allowed_origins.split(",")]
CORS(app, resources={r"/*": {"origins": allowed_origins}})


# Load model and scaler once at startup
model_path = 'model.pkl'
scaler_path = 'scaler.pkl'

model = None
scaler = None

if os.path.exists(model_path) and os.path.exists(scaler_path):
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    print("Model and scaler loaded successfully.")
else:
    print("Warning: model.pkl or scaler.pkl not found. Run train_model.py first.")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/predict', methods=['POST'])
def predict():
    global model, scaler
    if model is None or scaler is None:
        # Try to load if they were generated after server startup
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
        else:
            return jsonify({"error": "Model or scaler is not loaded"}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    # Required fields
    required_fields = ['age', 'systolicBP', 'diastolicBP', 'bs', 'bodyTemp', 'heartRate']
    for f in required_fields:
        if f not in data:
            return jsonify({"error": f"Missing required field: {f}"}), 400

    try:
        age = float(data['age'])
        sys = float(data['systolicBP'])
        dia = float(data['diastolicBP'])
        bs_val = float(data['bs'])
        temp = float(data['bodyTemp'])
        hr = float(data['heartRate'])
    except (ValueError, TypeError):
        return jsonify({"error": "All vitals must be numeric values"}), 400

    # Range validation (UCI dataset is Age: 10-70, SystolicBP: 70-160, DiastolicBP: 50-100, BS: 6.0-19.0, Temp: 98-103, HR: 7-90?)
    # Let's use broader ranges to accommodate medical variations while preventing extremes
    errors = []
    if not (10 <= age <= 70):
        errors.append("Age must be between 10 and 70")
    if not (70 <= sys <= 180):
        errors.append("SystolicBP must be between 70 and 180 mmHg")
    if not (50 <= dia <= 120):
        errors.append("DiastolicBP must be between 50 and 120 mmHg")
    if not (6.0 <= bs_val <= 20.0):
        errors.append("Blood Sugar (BS) must be between 6.0 and 20.0 mmol/L")
    if not (95.0 <= temp <= 105.0):
        errors.append("Body Temperature must be between 95.0 and 105.0 F")
    if not (40 <= hr <= 140):
        errors.append("Heart Rate must be between 40 and 140 bpm")

    if errors:
        return jsonify({"error": "Validation errors", "messages": errors}), 400

    # Prepare features for prediction
    features = np.array([[age, sys, dia, bs_val, temp, hr]])
    
    # Scale features
    features_scaled = scaler.transform(features)
    
    # Predict probabilities
    probs = model.predict_proba(features_scaled)[0]
    classes = model.classes_
    
    # Get prediction class and confidence
    pred_idx = np.argmax(probs)
    risk_level = classes[pred_idx]
    confidence = float(probs[pred_idx])
    
    # Map probabilities to class names
    probs_dict = {str(classes[i]): float(probs[i]) for i in range(len(classes))}

    return jsonify({
        "riskLevel": risk_level,
        "confidence": confidence,
        "probabilities": probs_dict
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
