import logging
import sys
import json

from src.app.geocoder import Geocoder

h = logging.StreamHandler(sys.stdout)
logger = logging.getLogger(__name__)
logger.addHandler(h)
logger.setLevel(logging.INFO)
adm1ParsedData = json.load(open('data/adm1_parsed_data.json'))
adm2ParsedData = json.load(open('data/adm2_parsed_data.json'))
adm3ParsedData = json.load(open('data/adm3_parsed_data.json'))

class GeocodeSuggester:
    """Suggest geocoding by asking a cohort of geocoders to locate the query."""

    def __init__(self, geocoders):
        self.geocoders = geocoders
    
    def limitToValidResolution(self, queryLimit):
        values = set([Geocoder.Country, Geocoder.Admin1, Geocoder.Admin2, Geocoder.Admin3, Geocoder.Point])
        if queryLimit not in values:
            raise ValueError
        return queryLimit


    def suggest(self, request):
        """Interpret the request and pass it to the geocoders until one of them
        returns a geocode result."""
        if 'q' not in request:
            logger.debug('empty query')
            return []
        logger.debug(f"suggesting for query: {request['q']}")
        opts = { }
        if 'limitToResolution' in request:
            opts['limitToResolution'] = [self.limitToValidResolution(x) for x in request['limitToResolution'].split(',')]
        if 'limitToCountry' in request:
            opts['limitToCountry'] = request['limitToCountry'].split(',')
        logger.debug(f"opts: {opts}")
        for g in self.geocoders:
            suggestions = g.geocode(request['q'], opts)
            if len(suggestions) > 0:
                logger.debug(f"geocoder {g} suggests {suggestions}")
                filtered_suggestions = [s for s in suggestions if s['country'] is not None]
                if len(filtered_suggestions) < len(suggestions):
                    logger.debug(f"filtered response is {filtered_suggestions}")
                return filtered_suggestions
        logger.debug(f"No suggestions for query {request['q']}")
        return []

    def suggest_admin1(self, admin0):
        return adm1ParsedData.get(admin0)

    def suggest_admin2(self, admin1WikiId):
        return adm2ParsedData.get(admin1WikiId)

    def suggest_admin3(self, admin2WikiId):
        return adm3ParsedData.get(admin2WikiId)
