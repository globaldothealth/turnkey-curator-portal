import App from '.';
import axios from 'axios';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, fireEvent, screen, waitFor, within } from '../util/test-utils';
import { initialLoggedInState } from '../../redux/store';
import { MapLink } from '../../constants/types';
import validateEnv from '../../util/validate-env';
import { Role } from '../../api/models/User';

const mockedDataDictionaryLink = 'https://global.health/data-dictionary';

const env = validateEnv();

beforeAll(() => {
    vi.mock('axios');
});

afterAll(() => {
    vi.clearAllMocks();
});

beforeEach(() => {
    vi.clearAllMocks();
});

// beforeAll(() => {
//     process.env.VITE_APP_DATA_DICTIONARY_LINK = mockedDataDictionaryLink;
// });

describe('<App />', () => {
    it('renders without crashing when logged in', async () => {
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

        render(<App />, { initialState: initialLoggedInState });
        expect(axios.get).toHaveBeenCalledTimes(5);
        expect(axios.get).toHaveBeenCalledWith('/auth/profile');
        expect(axios.get).toHaveBeenCalledWith('/version');
        expect(axios.get).toHaveBeenCalledWith('/env');
        expect(axios.get).toHaveBeenCalledWith('/diseaseName');
        expect(await screen.findByTestId('profile-menu')).toBeInTheDocument();
    });

    it('renders without crashing when logged out', async () => {
        const axiosResponse = {
            status: 403,
            statusText: 'Forbidden',
            config: {},
            headers: {},
        };
        axios.get.mockImplementation((url) => {
            if (url === '/version') {
                return Promise.resolve({ status: 200, data: '1.10.1' });
            } else if (url === '/diseaseName') {
                return Promise.resolve({
                    status: 200,
                    data: env.VITE_APP_DISEASE_NAME,
                });
            } else {
                return Promise.resolve(axiosResponse);
            }
        });
        render(<App />);
        expect(axios.get).toHaveBeenCalledTimes(4);
        expect(axios.get).toHaveBeenCalledWith('/auth/profile');
        expect(axios.get).toHaveBeenCalledWith('/version');
        expect(axios.get).toHaveBeenCalledWith('/env');
        expect(axios.get).toHaveBeenCalledWith('/diseaseName');
        expect(screen.queryByTestId('profile-menu')).not.toBeInTheDocument();
    });

    it('has drawer links', async () => {
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
        axios.get.mockImplementation((url) => {
            if (url === '/env') {
                return Promise.resolve({ status: 200, data: 'local' });
            } else if (url === '/version') {
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
        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        expect(await screen.findByTestId('mapLink')).toHaveAttribute(
            'href',
            MapLink[env.SERVICE_ENV],
        );
        expect(await screen.findByTestId('dictionaryButton')).toHaveAttribute(
            'href',
            mockedDataDictionaryLink,
        );
        expect(await screen.findByTestId('termsButton')).toHaveAttribute(
            'href',
            'https://global.health/terms-of-use',
        );
        expect(
            await screen.findByTestId('privacypolicybutton'),
        ).toHaveAttribute('href', 'https://global.health/privacy/');
    });

    it('opens profile menu and contains all the links', async () => {
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
        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        fireEvent.click(await screen.findByTestId('profile-menu'));

        await waitFor(() => {
            const profileMenu = screen.getByTestId('profile-menu-dropdown');
            expect(profileMenu).toBeInTheDocument();

            expect(
                within(profileMenu).getByText(/Logout/i),
            ).toBeInTheDocument();
            expect(
                within(profileMenu).getByText(/Profile/i),
            ).toBeInTheDocument();
            expect(
                within(profileMenu).getByText(/Global.Health/i),
            ).toBeInTheDocument();
            expect(
                within(profileMenu).getByText(/Data dictionary/i),
            ).toBeInTheDocument();
            expect(
                within(profileMenu).getByText(/Data acknowledgments/i),
            ).toBeInTheDocument();
            expect(
                within(profileMenu).getByText(/View source on Github/i),
            ).toBeInTheDocument();
        });
    });

    it('Should open filters modal', async () => {
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
        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        userEvent.click(screen.getByRole('button', { name: /Filter/i }));

        await waitFor(() => {
            expect(screen.getByText(/Apply filters/i)).toBeInTheDocument();
        });
    });
});

describe('Download dataset', () => {
    it('Displays download dialog after clicking DownloadButton', async () => {
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
        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        fireEvent.click(await screen.findByText(/download dataset/i));
        expect(
            await screen.findByText(/download full dataset/i),
        ).toBeInTheDocument();
    });
});
