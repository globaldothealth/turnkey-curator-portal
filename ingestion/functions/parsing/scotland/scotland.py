import json
import os
import sys
from datetime import datetime
import csv

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
try:
    import parsing_lib
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir,os.pardir, 'common'))
    import parsing_lib



def convert_date(raw_date: str, dataserver=True):
    """
    Convert raw date field into a value interpretable by the dataserver.
    The date is listed in mddyy format,
    """
    date = datetime.strptime(raw_date, "%Y%m%d")
    if not dataserver:
        return date.strftime("%m/%d/%Y")
    return date.strftime("%m/%d/%YZ")


def convert_demographics(entry):
    '''
    If age is 85plus then give age range 85-120. Otherwise extract lower bound and upper bound of age
    No need for convert_gender function, as string is provided in correct format
    '''
    demo = {}
    if entry['AgeGroup'] == '85plus':
        demo["ageRange"] = {
            "start": 85,
            "end": 120
        }
    else:
        lb, ub = entry['AgeGroup'].split(' to ')
        demo["ageRange"] = {
            "start": int(lb),
            "end": int(ub)
        }
    demo["gender"] = entry['Sex']
    return demo


def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from: https://raw.githubusercontent.com/ThisIsIsaac/Data-Science-for-COVID-19/master/Covid19_Dataset/patients.csv.

    Scotland has datasets all presented in aggregated form. This parser currently uses the Age + Sex
    Daily positives: for each date, they provide the total number of Males or Females infected,
    within a particular age group. We want individual cases, so we want to do the following transformation:

    Age: 15-19 | Sex: Female | TotalPositives: 5 -->  5 individual cases with Sex=Female and Age Range.

    This aggregation massively limits data we can use, so until we can find a way to complement with other datasets,
    we have no location data, no UUIDs, and no other fields of interest.

    We'll loop through each date, only selecting rows referring specifically to Males or Females and a particular age group
    (some rows show total across all ages/sexes)

    If age is 85plus then give age range 85-120, otherwise extract lower bound and upper bound of age
    No need for convert_gender function, as string is provided in correct format

    The data actually contains two different groups of age range: 0-14, 15-19, 20-24, 25-44, 45-64, 65-74, 75-84 and 85+,
    and 0-59 and 60+. If we ingest all of these then we double count cases. Therefore, only use the more specific age ranges.
    """

    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=',')
        cases = []
        notes = []
        for entry in reader:
            ageGroup = entry['AgeGroup']
            relevantAgeGroup = ageGroup not in ['Total', '60+', '0 to 59']
            if int(entry['DailyPositive']
                   ) > 0 and entry['Sex'] != 'Total' and relevantAgeGroup:
                case = {
                    "caseReference": {
                        "sourceId": source_id,
                        "sourceUrl": source_url
                    },
                    "events": [
                        {
                            "name": "confirmed",
                            "dateRange":
                                {
                                    "start": convert_date(entry["Date"]),
                                    "end": convert_date(entry["Date"])
                                }
                        }
                    ],
                    "demographics": convert_demographics(entry),
                    "location": {
                        "name": "Scotland",
                        "administrativeAreaLevel1": "Scotland",
                        "country": "United Kingdom",
                        "geoResolution": "Admin1",
                        "geometry": {
                            "latitude": 56.7863,
                            "longitude": -4.1140
                        }
                    }
                }
                for _ in range(int(entry['DailyPositive'])):
                    yield case



def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
