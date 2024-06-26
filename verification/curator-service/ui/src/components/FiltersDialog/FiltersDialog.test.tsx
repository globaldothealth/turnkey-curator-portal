import { render, screen } from '../util/test-utils';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { format } from 'date-fns';
import { initialLoggedInState } from '../../redux/store';
import axios from 'axios';
import { vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import validateEnv from '../../util/validate-env';
import { Role } from '../../api/models/User';

const env = validateEnv();

beforeAll(() => {
    vi.mock('axios');
});

afterAll(() => {
    vi.clearAllMocks();
});

beforeEach(() => {
    jest.clearAllMocks();

    axios.get.mockImplementation((url) => {
        if (url === '/version') {
            return Promise.resolve({ status: 200, data: '1.10.1' });
        } else if (url === '/diseaseName') {
            return Promise.resolve({
                status: 200,
                data: env.VITE_APP_DISEASE_NAME,
            });
        } else if (url.includes('/api/cases')) {
            return Promise.resolve({
                status: 200,
                data: { cases: [], total: 0 },
            });
        } else {
            return Promise.resolve(axiosResponse);
        }
    });
});

const axiosResponse = {
    data: {
        _id: '1',
        googleID: '42',
        name: 'Alice Smith',
        email: 'foo@bar.com',
        roles: [Role.Admin],
    },
    status: 200,
    statusText: 'OK',
    config: {},
    headers: {},
};

describe('<FiltersDialog />', () => {
    it('Should render properly', async () => {
        const user = userEvent.setup();

        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        await act(async () => {
            await user.click(screen.getByRole('button', { name: /FILTER/i }));
        });

        expect(await screen.findByText(/Apply filters/i)).toBeInTheDocument();
    });

    it("Doesn't apply filters when future date is set", async () => {
        const user = userEvent.setup();

        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        await act(async () => {
            await user.click(screen.getByRole('button', { name: /FILTER/i }));
        });

        expect(await screen.findByText(/Apply filters/i)).toBeInTheDocument();

        const date = new Date();
        // Make sure the date is always in the future for the test
        date.setDate(date.getDate() + 1);
        const futureDate = format(date, 'yyyy-MM-dd');

        const toDateInput = screen.getByLabelText(/Date confirmed to/i);
        const fromDateInput = screen.getByLabelText(/Date confirmed from/i);

        await act(async () => {
            await user.type(toDateInput, futureDate);
            await user.type(fromDateInput, futureDate);

            await user.click(screen.getByRole('button', { name: 'Apply' }));
        });

        // Check if the modal is still open
        expect(await screen.findByText(/Apply filters/i)).toBeInTheDocument();
    });
});
