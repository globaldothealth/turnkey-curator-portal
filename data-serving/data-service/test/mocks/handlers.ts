import { http, HttpResponse } from 'msw';

const fakeGeocodes: Map<string, any> = new Map();

export const seed = (req: string, res: any) => {
    fakeGeocodes.set(req, res);
};

export const clear = () => {
    fakeGeocodes.clear();
};

export const handlers = [
    http.get('http://localhost:3003/geocode', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        if (!query) {
            return new HttpResponse(null, { status: 400 });
        }
        if (fakeGeocodes.has(query)) {
            return new HttpResponse(JSON.stringify([fakeGeocodes.get(query)]), {
                status: 200,
            });
        } else {
            return new HttpResponse(null, { status: 404 });
        }
    }),
];
