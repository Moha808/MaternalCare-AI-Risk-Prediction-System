import unittest
import json
from app import app

class MaternalHealthAPITestCase(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_health_check(self):
        """Test the GET /health endpoint."""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data.get('status'), 'ok')

    def test_predict_valid_input(self):
        """Test /predict with medically realistic and valid input."""
        payload = {
            "age": 25,
            "systolicBP": 120,
            "diastolicBP": 80,
            "bs": 7.0,
            "bodyTemp": 98.6,
            "heartRate": 72
        }
        response = self.client.post(
            '/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('riskLevel', data)
        self.assertIn('confidence', data)
        self.assertIn('probabilities', data)
        self.assertIn(data['riskLevel'], ['low risk', 'mid risk', 'high risk'])

    def test_predict_missing_fields(self):
        """Test /predict returns 400 when fields are missing."""
        payload = {
            "age": 25,
            # systolicBP is missing
            "diastolicBP": 80,
            "bs": 7.0,
            "bodyTemp": 98.6,
            "heartRate": 72
        }
        response = self.client.post(
            '/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertTrue(data['error'].startswith('Missing required field'))

    def test_predict_invalid_data_types(self):
        """Test /predict returns 400 when fields have non-numeric data types."""
        payload = {
            "age": "invalid_age",
            "systolicBP": 120,
            "diastolicBP": 80,
            "bs": 7.0,
            "bodyTemp": 98.6,
            "heartRate": 72
        }
        response = self.client.post(
            '/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertEqual(data.get('error'), 'All vitals must be numeric values')

    def test_predict_out_of_range_values(self):
        """Test /predict returns 400 when vitals are out of medically valid bounds."""
        payload = {
            "age": 5,  # Out of range (min 10)
            "systolicBP": 220,  # Out of range (max 180)
            "diastolicBP": 80,
            "bs": 7.0,
            "bodyTemp": 98.6,
            "heartRate": 72
        }
        response = self.client.post(
            '/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertEqual(data.get('error'), 'Validation errors')
        self.assertIn('messages', data)
        self.assertTrue(len(data['messages']) >= 2)

if __name__ == '__main__':
    unittest.main()
