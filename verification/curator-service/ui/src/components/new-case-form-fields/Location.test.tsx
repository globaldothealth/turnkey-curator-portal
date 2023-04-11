import { Form, Formik } from 'formik';

import Location from './Location';
import { render, screen } from '../util/test-utils';

it('shows location when passed location information', async () => {
    render(
        <Formik
            initialValues={{
                location: {
                    geoResolution: 'point',
                    country: 'United States',
                    countryISO2: 'US',
                    city: 'Chicago',
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
    expect(screen.getByDisplayValue(/point/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/united States/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Chicago/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/53.426588/i)).toBeInTheDocument();
});
