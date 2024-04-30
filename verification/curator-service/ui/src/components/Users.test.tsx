import { screen, fireEvent, render, within, waitFor } from './util/test-utils';
import { act } from 'react-dom/test-utils';

import Users from './Users';
import axios from 'axios';
import { vi } from 'vitest';
import { initialLoggedInState } from '../redux/store';
import userEvent from '@testing-library/user-event';
import { Role } from '../api/models/User';

beforeAll(() => {
    vi.mock('axios');
});

afterAll(() => {
    vi.clearAllMocks();
});

beforeEach(() => {
    jest.clearAllMocks();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockGetAxios(getUsersResponse: any): void {
    axios.get.mockImplementation((url) => {
        switch (url) {
            case '/api/users/roles':
                return Promise.resolve({
                    data: {
                        roles: [Role.Admin, Role.Curator, Role.JuniorCurator],
                    },
                });
            case '/api/users/':
            case '/api/users/?limit=10&page=1':
                return Promise.resolve(getUsersResponse);
            default:
                return Promise.reject();
        }
    });
}

describe('<Users />', () => {
    test('lists users', async () => {
        const users = [
            {
                _id: 'admin',
                name: 'Admin',
                email: 'admin.test@global.health',
                roles: [Role.Admin],
            },
            {
                _id: 'curator',
                name: '',
                email: 'curator.test@global.health',
                roles: [Role.Curator],
            },
            {
                _id: 'junior_curator',
                name: 'Junior Curator',
                email: 'junior_curator.test@global.health',
                roles: [Role.JuniorCurator],
            },
        ];
        const axiosResponse = {
            data: {
                users: users,
                total: 2,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockGetAxios(axiosResponse);
        render(<Users onUserChange={jest.fn()} />);
        expect(axios.get).toHaveBeenCalledWith('/api/users/?limit=10&page=1');

        // Find Admin user and check if all the data is correct
        expect(await screen.findByText('Admin')).toBeInTheDocument();
        expect(
            await screen.findByText('admin.test@global.health'),
        ).toBeInTheDocument();
        expect(await screen.findByText(Role.Admin)).toBeInTheDocument();

        // Find Curator user with missing name and check if all the data is correct
        expect(
            await screen.findByText('Name not provided'),
        ).toBeInTheDocument();
        expect(
            await screen.findByText('curator.test@global.health'),
        ).toBeInTheDocument();
        expect(await screen.findByText(Role.Curator)).toBeInTheDocument();

        // Find Junior Curator user and chceck if all the data is correct
        expect(await screen.findByText('Junior Curator')).toBeInTheDocument();
        expect(
            await screen.findByText('junior_curator.test@global.health'),
        ).toBeInTheDocument();
        expect(await screen.findByText(Role.JuniorCurator)).toBeInTheDocument();
    });

    test('updates roles on selection', async () => {
        const users = [
            {
                _id: 'abc123',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: [Role.Admin],
            },
        ];
        const axiosResponse = {
            data: {
                users: users,
                total: 1,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockGetAxios(axiosResponse);

        // Shows initial roles
        render(<Users onUserChange={jest.fn()} />);
        expect(await screen.findByText('Alice Smith')).toBeInTheDocument();
        expect(await screen.findByText(/admin/)).toBeInTheDocument();
        expect(screen.queryByText(Role.JuniorCurator)).not.toBeInTheDocument();

        // Select new role
        const updatedUsers = [
            {
                _id: 'abc123',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: [Role.Admin, Role.JuniorCurator],
            },
        ];
        const axiosPutResponse = {
            data: {
                users: updatedUsers,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.put.mockResolvedValueOnce(axiosPutResponse);
        await act(async () => {
            fireEvent.mouseDown(
                screen.getByTestId('Alice Smith-select-roles-button'),
            );
        });
        const listbox = within(screen.getByRole('listbox'));
        await act(async () => {
            fireEvent.click(listbox.getByText(/junior curator/i));
        });
        await act(async () => {
            fireEvent.keyDown(screen.getByRole('listbox'), {key: 'Escape'});
        });

        // Check roles are updated
        expect(axios.put).toHaveBeenCalledTimes(1);
        expect(axios.put).toHaveBeenCalledWith('/api/users/abc123', {
            roles: [Role.Admin, Role.JuniorCurator],
        });
    });

    test.skip('calls callback when user is changed', async () => {
        const user = userEvent.setup();

        const testUser = {
            _id: 'abc123',
            googleID: '42',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: [Role.Admin],
        };
        const axiosResponse = {
            data: {
                users: [testUser],
                total: 1,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };

        jest.mock('@mui/material/styles');

        mockGetAxios(axiosResponse);

        let functionCalledCounter = 0;

        render(<Users onUserChange={() => functionCalledCounter++} />, {
            initialState: initialLoggedInState,
        });
        expect(await screen.findByText('Alice Smith')).toBeInTheDocument();

        const updatedUser = {
            _id: 'abc123',
            googleID: '42',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: [Role.Admin, Role.Curator],
        };
        const axiosPutResponse = {
            data: updatedUser,
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.put.mockResolvedValueOnce(axiosPutResponse);
        expect(functionCalledCounter).toBe(0);

        // Select new role
        await userEvent.click(
            screen.getByTestId('Alice Smith-select-roles-button'),
        );

        await user.click(screen.getByText(/Curator/i));
        // Awaiting this text gives time for the async functions to complete.

        screen.debug(undefined, 30000);

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();

            // Check callback has been called
            expect(functionCalledCounter).toBe(1);
        });
    });

    test('callback not called when other users are changed', async () => {
        let functionCalledCounter = 0;
        const user = {
            _id: 'abc123',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: [Role.Admin],
        };
        const axiosResponse = {
            data: {
                users: [user],
                total: 1,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockGetAxios(axiosResponse);

        render(
            <Users
                onUserChange={() => {
                    functionCalledCounter++;
                }}
            />,
            {
                initialState: {
                    ...initialLoggedInState,
                    auth: {
                        ...initialLoggedInState.auth,
                        user: {
                            id: 'abc321',
                            googleID: '42',
                            name: 'Alice Smith',
                            email: 'foo@bar.com',
                            roles: [Role.Admin],
                        },
                    },
                },
            },
        );
        expect(await screen.findByText('Alice Smith')).toBeInTheDocument();

        const updatedUser = {
            _id: 'abc123',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: [Role.Admin, Role.JuniorCurator],
        };
        const axiosPutResponse = {
            data: {
                users: [updatedUser],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        axios.put.mockResolvedValueOnce(axiosPutResponse);
        expect(functionCalledCounter).toBe(0);

        // Select new role
        fireEvent.mouseDown(
            screen.getByTestId('Alice Smith-select-roles-button'),
        );
        const listbox = within(screen.getByRole('listbox'));
        fireEvent.click(listbox.getByText(/junior curator/i));
        fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

        // Awaiting this text gives time for the async functions to complete.
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();

            // Check callback has not been called
            expect(functionCalledCounter).toBe(0);
        });
    });
});
