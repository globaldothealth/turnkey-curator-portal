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
        self.Q3040071 = [
            {
                "name": "Annobón",
                "wiki": "Q3736616"
            },
            {
                "name": "Bioko Norte",
                "wiki": "Q845834"
            },
            {
                "name": "Bioko Sur",
                "wiki": "Q845817"
            }
        ]
        self.Q6142 = [
            {
                "name": "Beelitz",
                "wiki": "Q544439"
            },
            {
                "name": "Beetzsee",
                "wiki": "Q836639"
            },
            {
                "name": "Beetzseeheide",
                "wiki": "Q624298"
            },
            {
                "name": "Bad Belzig",
                "wiki": "Q523642"
            },
            {
                "name": "Bensdorf",
                "wiki": "Q636892"
            },
            {
                "name": "Borkheide",
                "wiki": "Q624241"
            },
            {
                "name": "Borkwalde",
                "wiki": "Q623947"
            },
            {
                "name": "Brück",
                "wiki": "Q622858"
            },
            {
                "name": "Buckautal",
                "wiki": "Q640310"
            },
            {
                "name": "Golzow",
                "wiki": "Q640637"
            },
            {
                "name": "Görzke",
                "wiki": "Q625844"
            },
            {
                "name": "Gräben",
                "wiki": "Q623929"
            },
            {
                "name": "Groß Kreutz (Havel)",
                "wiki": "Q625962"
            },
            {
                "name": "Havelsee",
                "wiki": "Q629403"
            },
            {
                "name": "Kleinmachnow",
                "wiki": "Q104192"
            },
            {
                "name": "Kloster Lehnin",
                "wiki": "Q627838"
            },
            {
                "name": "Linthe",
                "wiki": "Q204109"
            },
            {
                "name": "Michendorf",
                "wiki": "Q612992"
            },
            {
                "name": "Mühlenfließ",
                "wiki": "Q622545"
            },
            {
                "name": "Niemegk",
                "wiki": "Q635620"
            },
            {
                "name": "Nuthetal",
                "wiki": "Q622474"
            },
            {
                "name": "Päwesin",
                "wiki": "Q622487"
            },
            {
                "name": "Planebruch",
                "wiki": "Q177987"
            },
            {
                "name": "Planetal",
                "wiki": "Q625868"
            },
            {
                "name": "Rabenstein",
                "wiki": "Q623891"
            },
            {
                "name": "Rosenau",
                "wiki": "Q634705"
            },
            {
                "name": "Roskow",
                "wiki": "Q622513"
            },
            {
                "name": "Schwielowsee",
                "wiki": "Q625403"
            },
            {
                "name": "Seddiner See",
                "wiki": "Q623943"
            },
            {
                "name": "Stahnsdorf",
                "wiki": "Q640426"
            },
            {
                "name": "Teltow",
                "wiki": "Q572512"
            },
            {
                "name": "Treuenbrietzen",
                "wiki": "Q625078"
            },
            {
                "name": "Wenzlow",
                "wiki": "Q624292"
            },
            {
                "name": "Werder (Havel)",
                "wiki": "Q525686"
            },
            {
                "name": "Wiesenburg",
                "wiki": "Q623510"
            },
            {
                "name": "Wollin",
                "wiki": "Q627367"
            },
            {
                "name": "Wusterwitz",
                "wiki": "Q625379"
            },
            {
                "name": "Ziesar",
                "wiki": "Q199233"
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

    def test_admin1AreSuggested(self):
        response = self.client.get('/geocode/admin1?admin0=GNQ')
        assert response.status == '200 OK'
        assert response.json == self.gnq

    def test_admin1BadAdmin0ResultsInError(self):
        response = self.client.get('/geocode/admin1?admin0=completelyWrongId')
        assert response.status == '404 NOT FOUND'

    def test_admin1NoAdmin0ResultsInError(self):
        response = self.client.get('/geocode/admin1')
        assert response.status == '400 BAD REQUEST'

    def test_admin2AreSuggested(self):
        response = self.client.get('/geocode/admin1?admin1WikiId=Q3040071')
        assert response.status == '200 OK'
        assert response.json == self.Q3040071

    def test_admin2BadAdmin1ResultsInError(self):
        response = self.client.get('/geocode/admin2?admin1WikiId=completelyWrongId')
        assert response.status == '404 NOT FOUND'

    def test_admin2NoAdmin1ResultsInError(self):
        response = self.client.get('/geocode/admin2')
        assert response.status == '400 BAD REQUEST'

    def test_admin3AreSuggested(self):
        response = self.client.get('/geocode/admin3?admin2WikiId=Q6142')
        assert response.status == '200 OK'
        assert response.json == self.Q6142

    def test_admin3BadAdmin2ResultsInError(self):
        response = self.client.get('/geocode/admin3?admin2WikiId=completelyWrongId')
        assert response.status == '404 NOT FOUND'

    def test_admin3NoAdmin2ResultsInError(self):
        response = self.client.get('/geocode/admin3')
        assert response.status == '400 BAD REQUEST'
