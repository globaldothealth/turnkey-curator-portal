import * as fullCase from './fixtures/fullCase.json';
import { screen, render, waitFor } from './util/test-utils';
import EditCase from './EditCase';
import axios from 'axios';
import { initialLoggedInState } from '../redux/store';
import validateEnv from '../util/validate-env';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const env = validateEnv();

afterEach(() => {
    jest.clearAllMocks();
});

describe('<EditCase />', () => {
    it('loads and displays case to edit', async () => {
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

        mockedAxios.get.mockImplementation((url) => {
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

        render(
            <EditCase
                id="abc123"
                onModalClose={(): void => {
                    return;
                }}
                diseaseName={env.REACT_APP_DISEASE_NAME}
            />,
            {
                initialState: initialLoggedInState,
                initialRoute: '/cases/edit/abc123',
            },
        );

        expect(
            await screen.findByText('Enter the details for an existing case'),
        ).toBeInTheDocument();

        expect(screen.getByText('Submit case edit')).toBeInTheDocument();
        expect(screen.getByText(/male/)).toBeInTheDocument();
        expect(screen.getByDisplayValue(/Horse breeder/)).toBeInTheDocument();
        expect(screen.getByDisplayValue('France')).toBeInTheDocument();
        expect(screen.getByDisplayValue('recovered')).toBeInTheDocument();
        expect(screen.getByText('Severe pneumonia')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Moderna')).toBeInTheDocument();
        expect(screen.getByDisplayValue('PCR test')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2020/01/02')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2020/01/04')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2020/01/03')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2020/01/05')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2020/02/01')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2020/01/01')).toBeInTheDocument();
        expect(screen.getByText('confirmed')).toBeInTheDocument();
        // TODO: These show up locally but we need to figure out how to properly
        // query them in tests.
        // expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();
        //expect(await findByText(/Swedish/)).toBeInTheDocument();
        //expect(getByText('Severe acute respiratory')).toBeInTheDocument();
        // expect(
        //     getByDisplayValue('The reference sequence is identical to MN908947'),
        // ).toBeInTheDocument();
        //expect(getByText('2.35')).toBeInTheDocument();
        //expect(getByText('48.85')).toBeInTheDocument();
        //expect(getByDisplayValue('Hypertension')).toBeInTheDocument();
        //expect(getByDisplayValue('Plane')).toBeInTheDocument();
        // expect(
        //     getByDisplayValue('Contact of a confirmed case at work'),
        // ).toBeInTheDocument();
        //expect(getByDisplayValue('Vector borne')).toBeInTheDocument();
        //expect(getByDisplayValue('Gym')).toBeInTheDocument();
    });

    it('displays API errors', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('Request failed'));

        render(
            <EditCase
                id="abc123"
                onModalClose={(): void => {
                    return;
                }}
                diseaseName={env.REACT_APP_DISEASE_NAME}
            />,
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
        const errorMsg = await screen.findByText(/Request failed/);
        expect(errorMsg).toBeInTheDocument();
    });
});
