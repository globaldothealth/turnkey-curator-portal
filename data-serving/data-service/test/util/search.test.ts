import parseSearchQuery from '../../src/util/search';
import { ObjectId } from 'mongodb';

describe('search query', () => {
    it('is parsed with full text search', () => {
        const res = parseSearchQuery('some query');
        expect(res).toEqual({ fullTextSearch: 'some query', filters: [] });
    });

    it('is parsed with empty query', () => {
        const res = parseSearchQuery('');
        expect(res).toEqual({ fullTextSearch: '', filters: [] });
    });

    it('is parsed with negative searches', () => {
        const res = parseSearchQuery('want -nogood');
        expect(res).toEqual({ fullTextSearch: 'want -nogood', filters: [] });
    });

    it('errors if no value given for keyword', () => {
        expect(() => parseSearchQuery('country:')).toThrow(/country/);
    });

    it('consolidates keywords in query', () => {
        const res = parseSearchQuery('country: other gender:   female');
        expect(res).toEqual({
            filters: [
                {
                    path: 'demographics.gender',
                    values: ['female'],
                },
                {
                    path: 'location.countryISO3',
                    values: ['other'],
                },
            ],
        });
    });

    it('is parses tokens', () => {
        const res = parseSearchQuery(
            'gender:male ' +
                'occupation:"clock maker" country:switzerland outcome:recovered ' +
                'caseId:605c8f6a7ee6c2d7fd2670cc sourceUrl:wsj.com ' +
                'place:"some place" location:"some location"',
        );

        expect(res).toEqual({
            filters: [
                {
                    path: 'demographics.gender',
                    values: ['male'],
                },
                {
                    path: 'demographics.occupation',
                    values: ['clock maker'],
                },
                {
                    path: 'location.countryISO3',
                    values: ['switzerland'],
                },
                {
                    path: 'location.place',
                    values: ['some place'],
                },
                {
                    path: 'location.location',
                    values: ['some location'],
                },
                {
                    path: 'events.outcome',
                    values: ['recovered'],
                },
                {
                    path: '_id',
                    values: [new ObjectId('605c8f6a7ee6c2d7fd2670cc')],
                },
                {
                    path: 'caseReference.sourceUrl',
                    values: ['wsj.com'],
                },
            ],
        });
    });

    it('ignores unknown keywords', () => {
        const res = parseSearchQuery('something:else');
        expect(res).toEqual({ fullTextSearch: 'something:else', filters: [] });
    });
});
