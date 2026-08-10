import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

def main():
    # Load dataset
    data_path = 'data/maternal_health_risk.csv'
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Please run generate_data.py first.")
        return
        
    df = pd.read_csv(data_path)
    
    # Handle missing values
    df = df.dropna()
    
    # Handle outliers (e.g. SystolicBP, DiastolicBP, BS, BodyTemp, HeartRate - clamping to plausible ranges)
    df['Age'] = df['Age'].clip(10, 70)
    df['SystolicBP'] = df['SystolicBP'].clip(70, 180)
    df['DiastolicBP'] = df['DiastolicBP'].clip(50, 120)
    df['BS'] = df['BS'].clip(6.0, 20.0)
    df['BodyTemp'] = df['BodyTemp'].clip(95.0, 105.0)
    df['HeartRate'] = df['HeartRate'].clip(40, 140)
    
    # Features and Target
    X = df[['Age', 'SystolicBP', 'DiastolicBP', 'BS', 'BodyTemp', 'HeartRate']]
    y = df['RiskLevel']
    
    # Split train/test (stratified, 80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Models to compare
    models = {
        'Random Forest': RandomForestClassifier(random_state=42),
        'Gradient Boosting': GradientBoostingClassifier(random_state=42),
        'SVM': SVC(probability=True, random_state=42)
    }
    
    metrics_report = {}
    best_model_name = None
    best_f1 = -1
    best_model = None
    
    # Evaluate each
    for name, model in models.items():
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        # Calculate metrics
        acc = accuracy_score(y_test, y_pred)
        # Stratified/multiclass metrics
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
        cm = confusion_matrix(y_test, y_pred)
        
        # Keep metrics report info
        metrics_report[name] = {
            'accuracy': float(acc),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'confusion_matrix': cm.tolist()
        }
        
        print(f"\n==================== {name} ====================")
        print(f"Accuracy:  {acc:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall:    {recall:.4f}")
        print(f"F1 Score:  {f1:.4f}")
        print("Confusion Matrix:")
        print(cm)
        
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model = model
            
    print(f"\nBest Model: {best_model_name} (Weighted F1: {best_f1:.4f})")
    
    # Save the best model and scaler
    joblib.dump(best_model, 'model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    print("Saved best model to 'model.pkl' and scaler to 'scaler.pkl'.")
    
    # Save metrics report
    with open('metrics_report.json', 'w') as f:
        json.dump(metrics_report, f, indent=4)
    print("Saved metrics report to 'metrics_report.json'.")

if __name__ == '__main__':
    main()
