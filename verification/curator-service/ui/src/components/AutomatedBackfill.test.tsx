import { vi } from 'vitest';
import axios from 'axios';
import userEvent from '@testing-library/user-event';

import AutomatedBackfill from './AutomatedBackfill';
import { initialLoggedInState } from '../redux/store';
import {
    render,
    waitFor,
    screen,
    waitForElementToBeRemoved,
} from './util/test-utils';

// jest.setTimeout(30000);
vi.mock('axios');

afterEach(() => {
    jest.clearAllMocks();
});

it('renders form', async () => {
    const axiosSourcesResponse = {
        data: { sources: [] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    axios.get.mockResolvedValueOnce(axiosSourcesResponse);

    render(
        <AutomatedBackfill
            onModalClose={(): void => {
                return;
            }}
        />,
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    // Header text
    expect(screen.getByTestId('header-title')).toBeInTheDocument();
    expect(screen.getByTestId('header-blurb')).toBeInTheDocument();

    // Source selection
    expect(screen.getByTestId('caseReference')).toBeInTheDocument();

    // Date fields
    expect(
        screen.getByLabelText('First date to backfill (inclusive)'),
    ).toBeInTheDocument();
    expect(
        screen.getByLabelText('Last date to backfill (inclusive)'),
    ).toBeInTheDocument();

    // Buttons
    expect(screen.getByText(/backfill source/i)).toBeEnabled();
    expect(screen.getByText(/cancel/i)).toBeEnabled();
});

it('displays spinner and status post backfill', async () => {
    const user = userEvent.setup();

    const axiosSourcesResponse = {
        status: 304,
        data: {
            sources: [
                {
                    _id: '629df820edfb2600292c800e',
                    name: 'Example',
                    countryCodes: ['ZZ'],
                    origin: {
                        url: 'https://example.com',
                        license: 'MIT',
                        providerName: 'TEST',
                        providerWebsiteUrl: 'https://example.com',
                    },
                    format: 'JSON',
                    notificationRecipients: ['test@email.com'],
                    excludeFromLineList: false,
                    hasStableIdentifiers: true,
                },
            ],
            total: 1,
        },
    };

    const axiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };

    axios.get.mockImplementation((url) => {
        if (url.includes('/api/sources')) {
            return Promise.resolve(axiosSourcesResponse);
        } else {
            return Promise.resolve(axiosResponse);
        }
    });

    axios.post.mockResolvedValueOnce(axiosResponse);

    render(
        <AutomatedBackfill
            onModalClose={(): void => {
                return;
            }}
        />,
        { initialState: initialLoggedInState },
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    await user.click(
        screen.getByLabelText(/Paste URL for data source or search/i),
    );
    await user.click(screen.getByText('https://example.com'));

    const startDate = screen.getByRole('textbox', {
        name: 'First date to backfill (inclusive)',
    });
    const endDate = screen.getByRole('textbox', {
        name: 'Last date to backfill (inclusive)',
    });
    if (startDate === null || endDate === null) {
        throw Error('Unable to find date selector');
    }

    await user.click(screen.getAllByRole('button', { name: 'Choose date' })[0]);
    await user.click(screen.getByRole('gridcell', { name: '1' }));

    await user.click(screen.getByRole('button', { name: 'Choose date' }));
    await user.click(screen.getByRole('gridcell', { name: '2' }));

    await user.click(screen.getByTestId('submit'));

    expect(screen.getByTestId('submit')).toBeDisabled();
    expect(screen.getByTestId('cancel')).toBeDisabled();
    expect(screen.getByTestId('progress')).toBeInTheDocument();
    expect(screen.getByTestId('progressDetails')).toBeInTheDocument();
    expect(screen.getByText(/processing backfill/i)).toBeInTheDocument();
    waitForElementToBeRemoved(() => screen.getByTestId('progress'));
}, 15000);
