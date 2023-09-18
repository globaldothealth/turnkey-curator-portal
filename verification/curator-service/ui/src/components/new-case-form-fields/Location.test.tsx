import { Form, Formik } from 'formik';

import Location from './Location';
import { render, screen } from '../util/test-utils';

it('shows location when passed location information', async () => {
    render(
        <Formik
            initialValues={{
                location: {
                    country: 'United States',
                    countryISO3: 'USA',
                    region: 'Florida',
                    district: 'Collier County',
                    place: 'Chicago',
                    location: 'Central hospital',
                    geometry: { latitude: 53.426588, longitude: 14.549271 },
                },
            }}
            // onSubmit just here to appease tslint.
            onSubmit={async (values): Promise<void> => {
                return;
            }}
        >
            <Form>
                <Location />
            </Form>
        </Formik>,
    );
    expect(screen.getByDisplayValue(/USA/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Florida/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Collier County/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Chicago/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Central hospital/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/53.426588/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/14.549271/i)).toBeInTheDocument();
});
