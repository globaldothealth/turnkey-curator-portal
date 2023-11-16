import { fireEvent, render, waitFor, screen } from './util/test-utils';
import CaseForm from './CaseForm';
import axios from 'axios';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme/theme';
import { initialLoggedInState } from '../redux/store';
import mediaQuery from 'css-mediaquery';
import validateEnv from '../util/validate-env';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const env = validateEnv();

const createMatchMedia = (width: string) => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
            matches: mediaQuery.match(query, { width }),
            media: query,
            onchange: null,
            addListener: jest.fn(), // deprecated
            removeListener: jest.fn(), // deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
};

describe('<CaseForm />', () => {
    beforeEach(() => {
        const axiosSourcesResponse = {
            data: { sources: [] },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosSourcesResponse);
        const axiosSymptomsResponse = {
            data: { symptoms: [] },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosSymptomsResponse);
        const axiosOccupationResponse = {
            data: { occupations: [] },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosOccupationResponse);
        const axiosLocationCommentsResponse = {
            data: { locationComments: [] },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosLocationCommentsResponse);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders form', async () => {
        render(
            <CaseForm
                onModalClose={(): void => {
                    return;
                }}
                diseaseName={env.REACT_APP_DISEASE_NAME}
            />,
            {
                initialState: initialLoggedInState,
                initialRoute: '/cases/new',
            },
        );
        await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(4));
        expect(
            screen.getByText('Enter the details for a new case'),
        ).toBeInTheDocument();
        expect(screen.getByText(/Submit case/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Demographics/i)).toHaveLength(1);
        expect(screen.getAllByText(/Location/i)).toHaveLength(7);
        expect(screen.getAllByText(/Events/i)).toHaveLength(1);
        expect(screen.getByTestId('caseReference')).toBeInTheDocument();
    });

    it('Displays error icons for required fields when validation fails', async () => {
        // Case form needs to be rendered with higher screen width
        // in order to display navigation
        createMatchMedia('2560px');

        render(
            <ThemeProvider theme={theme}>
                <CaseForm
                    onModalClose={(): void => {
                        return;
                    }}
                    diseaseName={env.REACT_APP_DISEASE_NAME}
                />
            </ThemeProvider>,
            { initialState: initialLoggedInState, initialRoute: '/cases/new' },
        );

        const submittButton = screen.getByText(/Submit case/i);
        fireEvent.click(submittButton);

        expect(await screen.findAllByTestId('error-icon')).toHaveLength(4);
    });
});
