import { Form, Formik } from 'formik';
import { vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import axios from 'axios';

import Location from './Location';
import { render, screen } from '../util/test-utils';

beforeAll(() => {
    vi.mock('axios');
});

it('shows location when passed location information', async () => {
    axios.get.mockImplementation(() => {
        return Promise.resolve({ data: [] });
    });
    await act(() => {
        render(
            <Formik
                initialValues={{
                    location: {
                        country: 'United States of America',
                        countryISO3: 'USA',
                        admin1: 'Florida',
                        admin2: 'Collier County',
                        admin3: 'Chicago',
                        geometry: { latitude: 53.426588, longitude: 14.549271 },
                    },
                }}
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                onSubmit={async (values): Promise<void> => {
                    return;
                }}
            >
                <Form>
                    <Location />
                </Form>
            </Formik>,
        );
    });
    expect(
        screen.getByDisplayValue(/United States of America/i),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Florida/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Collier County/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Chicago/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/53.426588/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/14.549271/i)).toBeInTheDocument();
});
