import { Form, Formik } from 'formik';

import Location from './Location';
import { render, screen } from '../util/test-utils';

it('shows location when passed location information', async () => {
    render(
        <Formik
            initialValues={{ country: 'United States', city: 'Chicago' }}
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
    expect(screen.getByDisplayValue(/united States/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Chicago/i)).toBeInTheDocument();
});
