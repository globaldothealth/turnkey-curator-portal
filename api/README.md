# Access Global.health data programmatically

This documents the process of downloading Global.health line list data
programmatically via Python or R. This process is different from using the API
that powers the Global.health website, some parts of which you can also access,
for which you can find the documentation at
https://data.covid-19.global.health/api-docs/

There is a [data
dictionary](https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/data_dictionary.txt)
which describes the columns in the downloaded data.

## Get your API key

To download data using one of our supported languages, you first need an API
key. Here are the steps to get one:

1. Login to the database at https://data.covid-19.global.health (or the instance pertaining to the outbreak you're interested in)
1. Go to your profile; click your user icon in the top-right corner, then "Profile" in the menu
1. Click Reset API Key (you only need to do this once)
1. Copy the API key

Keep in mind that the API key is unique to you, and should not be shared. If
you want to reset the API key, follow the above the process, otherwise the API
key is visible at your profile page.

## Filters

Currently the programmatic access via Python or R supports filtering by country
code only. We use [ISO 3166-1](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) two letter codes.

## Accessing data (R)

**Installation**: The R code is provided as a `globaldothealth` package that
can be installed directly from GitHub using the `devtools` package:

```R
install.packages("devtools")  # if you do not have devtools
devtools::install_github("globaldothealth/list/api/R")
```

Then it can be used like any R package:

```R
library(globaldothealth)
key <- "API KEY HERE"
c1 <- get_cases(key, country = "NZ")
```

This will download the New Zealand case data from the database. Re-downloading
datasets can take some time, particularly with large country datasets, so we
recommend using the `get_cached_cases()` function which caches the data
download to be used in later calls:

```R
library(globaldothealth)
key <- "API KEY HERE"
c1 <- get_cached_cases(key, country = "NZ")
# use refresh = TRUE to update the cache
c1 <- get_cached_cases(key, country = "NZ", refresh = TRUE)
```

You can also use R's in-built `help()` to access the documentation.

## Accessing data (Python)

**Requirements**: To run the script, you should have the [requests] and
[pandas] packages installed.

Download the [gdh.py](python/gdh.py) script to a folder, then:

```python
from gdh import GlobalDotHealth
key = "API KEY HERE"
covid_line_list = GlobalDotHealth(key, 'covid-19')
c1 = covid_line_list.get_cases(country="NZ")
```

This will download the New Zealand case data from the database. Re-downloading
datasets can take some time, particularly with large country datasets, so there
is a `get_cached_cases()` function which caches the data download which can be
used in later calls:

```python
from gdh import GlobalDotHealth
key = "API KEY HERE"
covid_line_list = GlobalDotHealth(key, 'covid-19')
c1 = covid_line_list.get_cached_cases(country="NZ")
# use refresh=True to update the cache
c1 = covid_line_list.get_cached_cases(country="NZ", refresh=True)
```

[httr]: https://httr.r-lib.org/
[readr]: https://readr.tidyverse.org/
[pandas]: https://pandas.pydata.org/
[requests]: https://docs.python-requests.org/en/latest/
[tidyverse]: https://www.tidyverse.org/
