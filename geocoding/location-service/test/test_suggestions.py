import unittest
from src.app import main


class SuggestionsTest(unittest.TestCase):

    def setUp(self):
        main.app.config['TESTING'] = True
        self.client = main.app.test_client()
        self.lyon = {
            'administrativeAreaLevel1': 'Rhône',
            'country': 'FR',
            'geometry': {
                'latitude': 45.75889,
                'longitude': 4.84139
            },
            'name': 'Lyon',
        }
        self.gnq = [
            {
                "name": "Insular",
                "wiki": "Q3040071"
            },
            {
                "name": "Continental",
                "wiki": "Q845368"
            }
       ]

    def test_seededGeocodesAreSuggested(self):
        self.client.post('/geocode/seed', json=self.lyon)
        response = self.client.get('/geocode/suggest?q=Lyon&limitToResolution=Country,Admin1')
        assert response.status == '200 OK'
        assert response.json == [self.lyon]

    def test_badResolutionLimitsResultInError(self):
        response = self.client.get('/geocode/suggest?q=Lyon&limitToResolution=nopenope')
        assert response.status == '422 UNPROCESSABLE ENTITY'
        assert response.data.find(b'nopenope') != -1

    def test_seededGeocodesAreSuggested(self):
        response = self.client.get('/geocode/admin1?admin0=GNQ')
        assert response.status == '200 OK'
        assert response.json == self.gnq

    def test_seededGeocodesAreSuggested(self):
        response = self.client.get('/geocode/admin1')
        assert response.status == '400 BAD REQUEST'
