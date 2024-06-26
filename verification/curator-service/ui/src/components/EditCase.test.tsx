import * as fullCase from './fixtures/fullCase.json';
import { screen, render } from './util/test-utils';
import EditCase from './EditCase';
import axios from 'axios';
import { vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { initialLoggedInState } from '../redux/store';
import validateEnv from '../util/validate-env';

beforeAll(() => {
    vi.mock('axios');
    vi.mock('react-router-dom', async () => {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const mod = (await vi.importActual('react-router-dom')) as {};
        return {
            ...mod,
            useParams: () => ({
                id: 'abc123',
            }),
        };
    });
});

afterAll(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.clearAllMocks();
});

const env = validateEnv();

describe('<EditCase />', () => {
    it.skip('loads and displays case to edit', async () => {
        const axiosCaseResponse = {
            data: [fullCase],
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        const axiosSourcesResponse = {
            data: { sources: [] },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        const axiosOccupationResponse = {
            data: { occupations: [] },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        const axiosSymptomsResponse = {
            data: { symptoms: [] },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };

        axios.get.mockImplementation((url) => {
            if (url.includes('/api/cases')) {
                return Promise.resolve(axiosCaseResponse);
            } else if (url.includes('/api/sources')) {
                return Promise.resolve(axiosSourcesResponse);
            } else if (url.includes('/api/occupations')) {
                return Promise.resolve(axiosOccupationResponse);
            } else if (url.includes('/api/symptoms')) {
                return Promise.resolve(axiosSymptomsResponse);
            } else {
                return Promise.resolve({ data: [] });
            }
        });

        await act(() => {
            render(
                <EditCase
                    onModalClose={(): void => {
                        return;
                    }}
                    diseaseName={env.VITE_APP_DISEASE_NAME}
                />,
                {
                    initialState: initialLoggedInState,
                },
            );
        });

        await waitFor(() => {
            expect(
                screen.getByText('Enter the details for an existing case'),
            ).toBeInTheDocument();
        });

        expect(
            await screen.findByText('Enter the details for an existing case'),
        ).toBeInTheDocument();

        expect(await screen.getByText('Submit case edit')).toBeInTheDocument();
        expect(screen.getByText(/male/)).toBeInTheDocument();
        expect(screen.getByDisplayValue(/Horse breeder/)).toBeInTheDocument();
        expect(screen.getByDisplayValue('France')).toBeInTheDocument();
        expect(screen.getByDisplayValue('recovered')).toBeInTheDocument();
        expect(screen.getByText('Severe pneumonia')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Moderna')).toBeInTheDocument();
        expect(screen.getByDisplayValue('PCR test')).toBeInTheDocument();
        expect(screen.getByText('confirmed')).toBeInTheDocument();
    });

    it('displays API errors', async () => {
        axios.get.mockRejectedValueOnce(new Error('Request failed'));

        render(
            <EditCase
                onModalClose={(): void => {
                    return;
                }}
                diseaseName={env.VITE_APP_DISEASE_NAME}
            />,
        );

        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith('/api/cases/abc123');
        const errorMsg = await screen.findByText(/Request failed/);
        expect(errorMsg).toBeInTheDocument();
    });
});
