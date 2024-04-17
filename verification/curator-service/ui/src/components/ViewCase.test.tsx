import * as fullCase from './fixtures/fullCase.json';

import { BrowserRouter as Router } from 'react-router-dom';
import ViewCase from './ViewCase';
import axios from 'axios';
import { vi } from 'vitest';
import { createMemoryHistory } from 'history';
import { render, fireEvent, screen } from './util/test-utils';
import { initialLoggedInState } from '../redux/store';
import validateEnv from '../util/validate-env';

vi.mock('axios');
const env = validateEnv();

afterEach(() => {
    vi.clearAllMocks();
});

it.skip('loads and displays case', async () => {
    const axiosResponse = {
        data: [fullCase],
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    axios.get.mockResolvedValueOnce(axiosResponse);

    render(
        <ViewCase
            onModalClose={(): void => {
                return;
            }}
            id="5ef8e943dfe6e00030892d58"
        />,
        {
            initialState: initialLoggedInState,
            initialRoute: '/cases/5ef8e943dfe6e00030892d58',
        },
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(
        '/api/cases/5ef8e943dfe6e00030892d58',
    );

    // Case data.
    expect(
        await screen.findByText(/Case 5ef8e943dfe6e00030892d58/),
    ).toBeInTheDocument();
    expect(
        screen.getByText(
            'https://www.colorado.gov/pacific/cdphe/news/10-new-presumptive-positive-cases-colorado-cdphe-confirms-limited-community-spread-covid-19',
        ),
    ).toBeInTheDocument();

    expect(screen.getAllByText('2020-01-02')).toHaveLength(2);
    expect(screen.getAllByText('2020-01-04')).toHaveLength(1);
    // Demographics.
    expect(screen.getByText('male')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Horse breeder')).toBeInTheDocument();
    // Location.
    expect(screen.getByText('France')).toBeInTheDocument();
    expect(screen.getByText('Île-de-France')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    // Events.
    expect(screen.getByText('2020-01-01')).toBeInTheDocument();
    expect(screen.getByText('2020-01-03')).toBeInTheDocument();
    expect(screen.getByText('2020-01-05')).toBeInTheDocument();
    expect(screen.getByText('2020-02-01')).toBeInTheDocument();
    expect(screen.getByText('recovered')).toBeInTheDocument();
    expect(screen.getByText('PCR test')).toBeInTheDocument();
    // Symptoms.
    expect(screen.getByText(/Severe pneumonia/)).toBeInTheDocument();
    expect(screen.getByText(/Dyspnea/)).toBeInTheDocument();
    expect(screen.getByText(/Weakness/)).toBeInTheDocument();
    // Travel history.
    // Pathogens and genome.
    expect(screen.getByText(env.VITE_APP_DISEASE_NAME)).toBeInTheDocument();
});

it.skip('can go to the edit page', async () => {
    const axiosResponse = {
        data: [fullCase],
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    axios.get.mockResolvedValueOnce(axiosResponse);

    const history = createMemoryHistory();
    const { findByText } = render(
        <Router>
            <ViewCase
                enableEdit={true}
                onModalClose={(): void => {
                    return;
                }}
            />
        </Router>,
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(
        '/api/cases/5ef8e943dfe6e00030892d58',
    );
    fireEvent.click(await findByText('Edit'));
    expect(history.location.pathname).toBe(
        '/cases/edit/5ef8e943dfe6e00030892d58',
    );
});

it.skip('does not show the edit button when not enabled', async () => {
    const axiosResponse = {
        data: [fullCase],
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    axios.get.mockResolvedValueOnce(axiosResponse);

    const { queryByText, findByText } = render(
        <ViewCase
            onModalClose={(): void => {
                return;
            }}
        />,
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('/api/cases/abc123');

    expect(
        await findByText(/Case 5ef8e943dfe6e00030892d58/),
    ).toBeInTheDocument();
    expect(queryByText('Edit')).toBeNull();
});

it.skip('displays API errors', async () => {
    axios.get.mockRejectedValueOnce(new Error('Request failed'));

    const { findByText } = render(
        <ViewCase
            onModalClose={(): void => {
                return;
            }}
        />,
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('/api/cases/abc123');
    expect(await findByText(/Request failed/)).toBeInTheDocument();
});
