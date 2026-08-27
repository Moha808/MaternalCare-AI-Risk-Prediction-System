import numpy as np
import pandas as pd
import os

def main():
    # Set random seed for reproducibility
    np.random.seed(42)
    n_samples = 1000

    # Ages: 15 to 50
    age = np.random.randint(15, 51, size=n_samples)

    # Latent health status (0 = low risk, 1 = mid risk, 2 = high risk)
    latent_status = np.random.choice([0, 1, 2], size=n_samples, p=[0.5, 0.3, 0.2])

    systolic_bp = []
    diastolic_bp = []
    bs = []
    body_temp = []
    heart_rate = []

    for status in latent_status:
        if status == 0: # Healthy / Low Risk
            sys = int(np.random.normal(110, 8))
            dia = int(np.random.normal(72, 6))
            sugar = round(np.random.uniform(4.0, 7.5), 1)
            temp = round(np.random.uniform(98.0, 98.6), 1)
            hr = int(np.random.normal(72, 5))
        elif status == 1: # Moderate / Mid Risk
            sys = int(np.random.normal(125, 10))
            dia = int(np.random.normal(82, 8))
            sugar = round(np.random.uniform(7.6, 11.0), 1)
            temp = round(np.random.uniform(98.0, 99.8), 1)
            hr = int(np.random.normal(80, 8))
        else: # Severe / High Risk
            sys = int(np.random.normal(142, 12))
            dia = int(np.random.normal(92, 10))
            sugar = round(np.random.uniform(11.1, 20.0), 1)
            temp = round(np.random.choice([np.random.uniform(98.0, 99.0), np.random.uniform(100.0, 103.0)], p=[0.4, 0.6]), 1)
            hr = int(np.random.normal(90, 10))
            
        sys = max(70, min(180, sys))
        dia = max(50, min(120, dia))
        sugar = max(3.0, min(30.0, sugar))
        temp = max(98.0, min(103.0, temp))
        hr = max(60, min(120, hr))
        
        systolic_bp.append(sys)
        diastolic_bp.append(dia)
        bs.append(sugar)
        body_temp.append(temp)
        heart_rate.append(hr)

    risk_levels = []
    gestational_age = []
    for i in range(n_samples):
        sys = systolic_bp[i]
        dia = diastolic_bp[i]
        sugar = bs[i]
        temp = body_temp[i]
        age_val = age[i]
        
        # Gestational age (weeks)
        ga = np.random.randint(4, 43)
        gestational_age.append(ga)
        
        # Calculate risk score
        score = 0
        if sys >= 140 or dia >= 90:
            score += 3
        elif sys >= 130 or dia >= 85:
            score += 1
            
        if sugar >= 11.0:
            score += 3
        elif sugar >= 7.8:
            score += 1
            
        if temp >= 100.4:
            score += 2
            
        if age_val >= 38 or age_val <= 17:
            score += 1
            
        # Add risk if high BP occurs in late pregnancy (preeclampsia risk)
        if (sys >= 130 or dia >= 85) and ga >= 20:
            score += 2
            
        if score >= 4:
            risk = 'high risk'
        elif score >= 1:
            risk = 'mid risk'
        else:
            risk = 'low risk'
            
        risk_levels.append(risk)

    df = pd.DataFrame({
        'Age': age,
        'GestationalAge': gestational_age,
        'SystolicBP': systolic_bp,
        'DiastolicBP': diastolic_bp,
        'BS': bs,
        'BodyTemp': body_temp,
        'HeartRate': heart_rate,
        'RiskLevel': risk_levels
    })

    # Create dir if not exists
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/maternal_health_risk.csv', index=False)
    print("Dataset generated successfully at data/maternal_health_risk.csv!")
    print(df['RiskLevel'].value_counts())

if __name__ == '__main__':
    main()
