import { render, screen, waitFor } from '../util/test-utils';
import LandingPage from './LandingPage';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';

describe('<ChangePasswordForm />', () => {
    beforeAll(() => {
        vi.stubEnv(
            'RECAPTCHA_SITE_KEY',
            '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
        );

        vi.mock('react-router-dom', async () => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            const mod = (await vi.importActual('react-router-dom')) as {};
            return {
                ...mod,
                useParams: () => ({
                    token: 123,
                    id: 456,
                }),
            };
        });
    });

    afterAll(() => {
        vi.clearAllMocks();
    });

    test('displays the change password form', async () => {
        render(<LandingPage />, { initialRoute: '/reset-password/token/id' });

        expect(screen.getByText('Choose a new password')).toBeInTheDocument();
    });

    test('displays verification errors when password in ChangePassword form is empty', async () => {
        const user = userEvent.setup();

        render(<LandingPage />, { initialRoute: '/reset-password/token/id' });

        await act(async () => {
            await user.click(screen.getByTestId('change-password-button'));
        });

        await waitFor(() => {
            expect(screen.getByText('Required!')).toBeInTheDocument();
        });
    });

    test('displays verification errors when confirm password is empty', async () => {
        const user = userEvent.setup();

        render(<LandingPage />, { initialRoute: '/reset-password/token/id' });

        await act(async () => {
            await user.type(screen.getByLabelText('Password'), '12345');
            await user.click(screen.getByTestId('change-password-button'));
        });

        await waitFor(() => {
            expect(
                screen.getByText('Passwords must match'),
            ).toBeInTheDocument();
        });
    });
});
