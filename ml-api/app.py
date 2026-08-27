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
    required_fields = ['age', 'gestationalAge', 'systolicBP', 'diastolicBP', 'bs', 'bodyTemp', 'heartRate']
    for f in required_fields:
        if f not in data:
            return jsonify({"error": f"Missing required field: {f}"}), 400

    try:
        age = float(data['age'])
        ga = float(data['gestationalAge'])
        sys = float(data['systolicBP'])
        dia = float(data['diastolicBP'])
        bs_val = float(data['bs'])
        temp = float(data['bodyTemp'])
        hr = float(data['heartRate'])
    except (ValueError, TypeError):
        return jsonify({"error": "All vitals must be numeric values"}), 400

    # Range validation
    errors = []
    if not (10 <= age <= 70): errors.append("Age must be between 10 and 70")
    if not (4 <= ga <= 43): errors.append("Gestational Age must be between 4 and 43 weeks")
    if not (70 <= sys <= 180): errors.append("SystolicBP must be between 70 and 180 mmHg")
    if not (50 <= dia <= 120): errors.append("DiastolicBP must be between 50 and 120 mmHg")
    if not (2.0 <= bs_val <= 30.0): errors.append("Blood Sugar (BS) must be between 2.0 and 30.0 mmol/L")
    if not (95.0 <= temp <= 105.0): errors.append("Body Temperature must be between 95.0 and 105.0 F")
    if not (40 <= hr <= 140): errors.append("Heart Rate must be between 40 and 140 bpm")

    if errors:
        return jsonify({"error": "Validation errors", "messages": errors}), 400

    # Prepare features for prediction (Must match training order: Age, GestationalAge, SystolicBP, DiastolicBP, BS, BodyTemp, HeartRate)
    features = np.array([[age, ga, sys, dia, bs_val, temp, hr]])
    
    # Scale features
    features_scaled = scaler.transform(features)
    
    # Predict probabilities
    probs = model.predict_proba(features_scaled)[0]
    classes = model.classes_
    
    # Get prediction class and confidence
    pred_idx = np.argmax(probs)
    risk_level = classes[pred_idx]
    confidence = float(probs[pred_idx])
    probs_dict = {str(classes[i]): float(probs[i]) for i in range(len(classes))}

    # Generate AI Clinical Suggestions
    suggestions = []
    if risk_level in ['mid risk', 'high risk']:
        if sys >= 140 or dia >= 90:
            if ga >= 20:
                suggestions.append("⚠️ Suspected Preeclampsia. Recommend immediate urine protein test, lab evaluation of liver/kidney function, and consider starting oral antihypertensives (e.g., Labetalol or Nifedipine) per protocol.")
            else:
                suggestions.append("⚠️ Chronic Hypertension detected. Monitor closely and consider baseline preeclampsia labs.")
        if bs_val >= 11.0:
            suggestions.append("⚠️ Severe Hyperglycemia. Screen for Gestational Diabetes. Recommend fasting blood glucose test and possible insulin therapy consultation.")
        elif bs_val >= 7.8:
            suggestions.append("⚠️ Elevated Blood Sugar. Recommend Oral Glucose Tolerance Test (OGTT) and dietary counseling.")
        if temp >= 100.4:
            suggestions.append("⚠️ Clinical Fever. Screen for maternal infection (UTI, Chorioamnionitis). Recommend CBC, blood cultures if persistent, and appropriate antipyretics/antibiotics.")
        if hr > 100:
            suggestions.append("⚠️ Maternal Tachycardia. Assess for dehydration, fever, or underlying cardiac issues. Recommend IV hydration and ECG if symptomatic.")

    if not suggestions and risk_level == 'low risk':
        suggestions.append("✅ Vitals are within normal ranges. Continue routine prenatal care and standard daily vitamins (Folic acid, Iron).")
    elif not suggestions:
        suggestions.append("⚠️ Vitals indicate some risk. Schedule a follow-up consultation to evaluate maternal health status.")

    return jsonify({
        "riskLevel": risk_level,
        "confidence": confidence,
        "probabilities": probs_dict,
        "suggestions": suggestions
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
