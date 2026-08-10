# MaternalCare: AI-Powered Maternal Risk Prediction System

MaternalCare is an advanced digital health platform designed to monitor pregnant mothers and automatically evaluate their risk of developing health complications (such as Preeclampsia or Gestational Diabetes) using Machine Learning.

## Features
- **Role-Based Access**: Specialized dashboards for Patients, Health Workers (Caseworkers), and System Administrators.
- **AI Risk Engine**: Processes daily vitals (Blood Pressure, Blood Sugar, Heart Rate, Temperature, Gestational Age, and Symptoms) to predict complication risks (High, Mid, Low).
- **Real-Time Alert System**: Automatically flags high-risk predictions and routes immediate alerts to the assigned caseworker's dashboard.
- **Risk History & Analytics**: Generates interactive charts and trends mapping patient vitals over the course of their pregnancy.
- **Dark Mode**: Fully responsive, accessible, and themeable UI (Light/Dark mode support).

## Tech Stack
- **Frontend**: React.js (Vite), TailwindCSS, Recharts, Lucide React
- **Backend / Database**: Firebase (Auth, Firestore, Hosting)
- **Machine Learning**: Python, Flask, Scikit-Learn (RandomForest Classifier)

## Project Setup

### 1. Frontend Setup (React/Vite)
1. Clone the repository and navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `frontend` directory based on `.env.example`:
   ```env
   VITE_FIREBASE_API_KEY="your_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your_project_id"
   VITE_FIREBASE_STORAGE_BUCKET="your_project.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
   VITE_FIREBASE_APP_ID="your_app_id"
   VITE_ML_API_URL="http://localhost:5000"
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Backend Setup (ML API)
1. Navigate to the `ml-api` folder.
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/Scripts/activate # Windows
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the data generation and model training scripts to create the `model.pkl`:
   ```bash
   python generate_data.py
   python train_model.py
   ```
5. Start the Flask API:
   ```bash
   python app.py
   ```

## Security Rules (Firestore)
Ensure that you deploy the Firestore security rules to allow proper role-based access:
```bash
firebase deploy --only firestore:rules
```
