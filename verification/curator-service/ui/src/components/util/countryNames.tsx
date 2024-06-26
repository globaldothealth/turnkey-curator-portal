import countries, { LocalizedCountryNames } from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';

// register en locale so we don't pack all the others
countries.registerLocale(en);

export function nameCountry(isoCode: string, country?: string): string {
    let countryName = countries.getName(isoCode, 'en', { select: 'official' });
    if (!countryName && country) {
        countryName = countries.getName(country, 'en', { select: 'official' });
    }

    return countryName || '';
}

export function codeForCountry(name: string): string {
    return countries.getAlpha3Code(name, 'en') || '';
}

export function allCountryNames(): LocalizedCountryNames<{
    select: 'official';
}> {
    return countries.getNames('en', { select: 'official' });
}
