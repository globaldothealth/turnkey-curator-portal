import { fireEvent, render, waitFor, screen } from './util/test-utils';
import CaseForm from './CaseForm';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme/theme';
import { initialLoggedInState } from '../redux/store';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const user = {
    _id: 'testUser',
    name: 'Alice Smith',
    email: 'foo@bar.com',
    roles: ['admin', 'curator'],
};

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
            diseaseName="COVID-19"
        />,
        {
            initialState: initialLoggedInState,
            initialRoute: '/cases/new',
        },
    );
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(3));
    expect(
        screen.getByText('Enter the details for a new case'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Submit case/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Demographics/i)).toHaveLength(1);
    expect(screen.getAllByText(/Location/i)).toHaveLength(4);
    expect(screen.getAllByText(/Events/i)).toHaveLength(1);
    expect(screen.getByTestId('caseReference')).toBeInTheDocument();
});

test('Check location error message to become red on submit', () => {
    render(
        <CaseForm
            onModalClose={(): void => {
                return;
            }}
            diseaseName="COVID-19"
        />,
        { initialState: initialLoggedInState, initialRoute: '/cases/new' },
    );

    const mandatoryLocationMessage = screen.getByText(
        'A location must be provided',
    );
    const submittButton = screen.getByText(/Submit case/i);
    fireEvent.click(submittButton);
    expect(mandatoryLocationMessage).toHaveClass('Mui-error');
});
