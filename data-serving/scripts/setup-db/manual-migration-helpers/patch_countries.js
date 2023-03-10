/*
 * This script should have been run before the migration 20211222101904-iso-country-codes.js
 * (which imposes the validation constraint that country fields must be two characters long).
 * Well, it shouldn't have been needed. The script batch_countries.js should migrate all cases
 * to the ISO-codes model, but in practice did not run to completion in dev. A few country
 * names were left over in the location.country field, which I discovered like this:
 * 
 * db.cases.distinct('location.country')
 * 
 * and fixed like this:
 * 
 * db.cases.updateMany({'location.country': 'Argentina'}, { $set: {'location.country' :'AR'}})
 * 
 * But a lot of cases had travel history that didn't get translated, and there were way more values
 * in there, so I wrote this script. I'm committing it so that we have a record and something we can
 * adapt to future use if needed (e.g. if the same occurs in prod.)
 */

// as I knew which country names to patch up, I didn't use the i18-iso-countries library for this.
const countries = [['Afghanistan', 'AF'],
 ['Albania', 'AL'],
 ['Andorra', 'AD',],
 ['Anguilla', 'AI',],
 ['Argentina', 'AR'],
 ['Armenia', 'AM'],
 ['Aruba', 'AW'],
 ['Australia', 'AU'],
 ['Austria', 'AT'],
 ['Azerbaijan', 'AZ'],
 ['Bahamas', 'BS'],
 ['Bangladesh', 'BD'],
 ['Belarus', 'BY'],
 ['Belgium', 'BE'],
 ['Benin', 'BJ'],
 ['Bolivia', 'BO'],
 ['Bosnia and Herzegovina', 'BA'],
 ['Brazil', 'BR'],
 ['British Virgin Islands', 'VG'],
 ['Bulgaria', 'BG'],
 ['Cameroon', 'CM'],
 ['Canada', 'CA'],
 ['Cape Verde', 'CV'],
 ['Central African Republic', 'CF'],
 ['Chile', 'CL'],
 ['China', 'CN'],
 ['Colombia', 'CO'],
 ['Comoros', 'KM'],
 ['Congo [Republic]', 'CG'],
 ['Costa Rica', 'CR'],
 ['Croatia', 'HR'],
 ['Cuba', 'CU'],
 ['Curaçao', 'CW'],
 ['Cyprus', 'CY'],
 ['Czech Republic', 'CZ'],
 ['Denmark', 'DK'],
 ['Dominica', 'DM'],
 ['Dominican Republic', 'DO'],
 ['Ecuador', 'EC'],
 ['Egypt', 'EG'],
 ['El Salvador', 'SV'],
 ['Estonia', 'EE'],
 ['Eswatini', 'SZ'],
 ['Ethiopia', 'ET'],
 ['Finland', 'FI'],
 ['France', 'FR'],
 ['French Polynesia', 'PF'],
 ['Georgia', 'GE'],
 ['Germany', 'DE'],
 ['Greece', 'GR'],
 ['Grenada', 'GD'],
 ['Guadeloupe', 'GP'],
 ['Guatemala', 'GT'],
 ['Guyana', 'GY'],
 ['Haiti', 'HT'],
 ['Honduras', 'HN'],
 ['Hungary', 'HU'],
 ['Iceland', 'IS'],
 ['India', 'IN'],
 ['Indonesia', 'ID'],
 ['Iran', 'IR'],
 ['Ireland', 'IE'],
 ['Israel', 'IL'],
 ['Italy', 'IT'],
 ['Jamaica', 'JM'],
 ['Japan', 'JP'],
 ['Jersey', 'JE'],
 ['Kazakhstan', 'KZ'],
 ['Kenya', 'KE'],
 ['Kosovo', 'XK'],
 ['Kyrgyzstan', 'KG'],
 ['Latvia', 'LV'],
 ['Lebanon', 'LB'],
 ['Libya', 'LY'],
 ['Liechtenstein', 'LI'],
 ['Lithuania', 'LT'],
 ['Luxembourg', 'LU'],
 ['Macedonia [FYROM]', 'MK'],
 ['Maldives', 'MV'],
 ['Mali', 'ML'],
 ['Malta', 'MT'],
 ['Martinique', 'MQ'],
 ['Mexico', 'MX'],
 ['Moldova', 'MD'],
 ['Montenegro', 'ME'],
 ['Morocco', 'MA'],
 ['Netherlands', 'NL'],
 ['Netherlands Antilles', 'AN'],
 ['Nicaragua', 'NI'],
 ['Nigeria', 'NG'],
 ['Norway', 'NO'],
 ['Oman', 'OM'],
 ['Pakistan', 'PK'],
 ['Panama', 'PA'],
 ['Paraguay', 'PY'],
 ["People's Republic of China", 'CN'],
 ['Peru', 'PE'],
 ['Philippines', 'PH'],
 ['Poland', 'PL'],
 ['Portugal', 'PT'],
 ['Puerto Rico', 'PR'],
 ['Qatar', 'QA'],
 ['Romania', 'RO'],
 ['Russia', 'RU'],
 ['Saint Barthélemy', 'BL'],
 ['Saint Helena', 'SH'],
 ['Saint Vincent and the Grenadines', 'VC'],
 ['Saudi Arabia', 'SA'],
 ['Serbia', 'RS'],
 ['Seychelles', 'SC'],
 ['Singapore', 'SG'],
 ['Slovakia', 'SK'],
 ['Slovenia', 'SI'],
 ['Somalia', 'SO'],
 ['South Africa', 'ZA'],
 ['South Korea', 'KR'],
 ['Spain', 'ES'],
 ['Sweden', 'SE'],
 ['Switzerland', 'CH'],
 ['Syria', 'SY'],
 ['Tajikistan', 'TJ'],
 ['Tanzania', 'TZ'],
 ['Thailand', 'TH'],
 ['Trinidad and Tobago', 'TT'],
 ['Tunisia', 'TN'],
 ['Turkey', 'TR'],
 ['U.S. Virgin Islands', 'VI'],
 ['Uganda', 'UG'],
 ['Ukraine', 'UA'],
 ['United Arab Emirates', 'AE'],
 ['United Kingdom', 'GB'],
 ['United States', 'US'],
 ['Uruguay', 'UY'],
 ['Uzbekistan', 'UZ'],
 ['Venezuela', 'VE'],
 ['Vietnam', 'VN']];

for (const [name, code] of countries) {
    print(`Updating ${name} to ${code}`);
    db.cases.updateMany({'travelHistory.travel.location.country': name}, {$set: {'travelHistory.travel.$.location.country': code}});
}