import { SearchParserResult, parse } from 'search-query-parser';
import { ObjectId } from 'mongodb';

export interface ParsedSearch {
    fullTextSearch?: string;
    dateOperator?: string;
    filters: {
        path: string;
        values: string[] | ObjectId[];
        dateOperator?: string;
    }[];
}

/** Parsing error is thrown upon invalid search query. */
export class ParsingError extends Error {}

// Map of keywords to their case data path.
// IMPORTANT: If you change this mapping, reflect the new keys in the openapi.yaml file as well.
const keywords = new Map<string, string>([
    ['gender', 'demographics.gender'],
    ['occupation', 'demographics.occupation'],
    ['country', 'location.countryISO3'],
    ['place', 'location.place'],
    ['location', 'location.location'],
    ['outcome', 'events.outcome'],
    ['lastModifiedBy', 'revisionMetadata.updateMetadata.curator'],
    ['caseId', '_id'],
    ['sourceUrl', 'caseReference.sourceUrl'],
    ['dateConfirmedFrom', 'events.dateEntry'],
    ['dateConfirmedTo', 'events.dateEntry'],
    ['dateModifiedFrom', 'revisionMetadata.updateMetadata.date'],
    ['dateModifiedTo', 'revisionMetadata.updateMetadata.date'],
]);

export default function parseSearchQuery(q: string): ParsedSearch {
    q = q.trim();
    // parse() doesn't handle most-likely mistyped queries like
    // "curator: foo@bar.com" (with a space after the semicolon).
    // Change the query here to account for that: this regexp removes all
    // whitespace after semicolons so that
    // "curator: foo@bar.com" becomes "curator:foo@bar.com".
    q = q.replace(/(\w:)(\s+)/g, '$1');
    const parsedSearch = parse(q, {
        offsets: false,
        keywords: [...keywords.keys()],
        alwaysArray: true,
    });
    const res: ParsedSearch = {
        filters: [],
    };
    // When no tokens are specified or found, the returned value is a string.
    if (typeof parsedSearch === 'string') {
        res.fullTextSearch = parsedSearch as string;
    } else {
        // When tokens are found, searchResult is a struct with tokens as properties
        // and full text search is contained in the "text" property.
        const searchParsedResult = parsedSearch as SearchParserResult;

        // We don't tokenize so "text" is a string, not an array of strings.
        res.fullTextSearch = searchParsedResult.text as string;
        // Get the keywords into our result struct.
        keywords.forEach((path, keyword): void => {
            // Clear filter by date from previous keyword
            if (searchParsedResult.dateOperator) {
                delete searchParsedResult.dateOperator;
            }
            // Enable to filter by date
            keyword === 'dateConfirmedFrom' || keyword === 'dateModifiedFrom'
                ? (searchParsedResult.dateOperator = '$gte')
                : null;
            keyword === 'dateConfirmedTo' || keyword === 'dateModifiedTo'
                ? (searchParsedResult.dateOperator = '$lt')
                : null;

            if (!searchParsedResult[keyword]) {
                return;
            }

            if (keyword === 'caseId') {
                const caseIds: ObjectId[] = [];
                searchParsedResult[keyword].forEach((caseId: string) => {
                    caseIds.push(new ObjectId(caseId));
                });

                res.filters.push({
                    path: path,
                    values: caseIds,
                    dateOperator: searchParsedResult.dateOperator,
                });
            } else {
                res.filters.push({
                    path: path,
                    values: searchParsedResult[keyword],
                    dateOperator: searchParsedResult.dateOperator,
                });
            }
        });
        if (res.filters.length === 0 && !res.fullTextSearch) {
            throw new ParsingError(`Invalid search query ${q}`);
        }
    }

    return res;
}
