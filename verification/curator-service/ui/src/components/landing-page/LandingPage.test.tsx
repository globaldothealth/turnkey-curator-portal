import { render, screen, waitFor } from '../util/test-utils';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import LandingPage from './LandingPage';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { vi } from 'vitest';

const server = setupServer();
const mockedDataDictionaryLink = 'https://global.health/data-dictionary';

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
    import.meta.env.VITE_APP_DATA_DICTIONARY_LINK = mockedDataDictionaryLink;
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

jest.mock('react-google-recaptcha', () => {
    const { forwardRef, useImperativeHandle } = jest.requireActual('react');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const RecaptchaV2 = forwardRef((props: any, ref: any) => {
        useImperativeHandle(ref, () => ({
            reset: jest.fn(),
            execute: jest.fn(),
            executeAsync: jest.fn(
                () => '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
            ),
        }));
        return (
            <input
                ref={ref}
                type="checkbox"
                data-testid="mock-v2-captcha-element"
                {...props}
            />
        );
    });

    return RecaptchaV2;
});

vi.stubEnv('RECAPTCHA_SITE_KEY', '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI');

describe('<LandingPage />', () => {
    test('shows all content', async () => {
        render(<LandingPage />);

        expect(screen.getByText(/Detailed line list data/)).toBeInTheDocument();
        expect(screen.getByText(/Welcome to G.h Data/)).toBeInTheDocument();
        expect(screen.getByText(/Sign in with Google/)).toBeInTheDocument();
        expect(screen.getByText(/Sign up form/)).toBeInTheDocument();
        expect(
            screen.getByText(/Already have an account?/),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /I agree to be added to the Global.health newsletter/i,
            ),
        ).toBeInTheDocument();
        expect(screen.getByText('Global.health website')).toHaveAttribute(
            'href',
            'https://global.health/',
        );
        expect(screen.getByText('Global.health map')).toHaveAttribute(
            'href',
            'https://map.covid-19.global.health/',
        );
        expect(screen.getByText('Data dictionary')).toHaveAttribute(
            'href',
            mockedDataDictionaryLink,
        );
        expect(screen.getByText('Terms of use')).toHaveAttribute(
            'href',
            'https://global.health/terms-of-use/',
        );
        expect(screen.getByText('Privacy policy')).toHaveAttribute(
            'href',
            'https://global.health/privacy/',
        );

        const cookiePolicyBtn = screen.getByText(
            'Cookie policy',
        ) as HTMLAnchorElement;

        expect(cookiePolicyBtn.href).toContain(
            'https://www.iubenda.com/privacy-policy',
        );
        expect(cookiePolicyBtn.href).toContain('cookie-policy');

        // Check partners logos
        expect(
            screen.getByText(/Participating Institutions:/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/With funding from:/i)).toBeInTheDocument();
        expect(screen.getAllByAltText(/Partner logo/i)).toHaveLength(11);
    });
});

describe('<SignInForm />', () => {
    it.skip('renders and submits form', async () => {
        server.use(
            rest.post('/auth/signin', (req, res, ctx) => {
                return res(
                    ctx.status(403),
                    ctx.json({ message: 'Wrong username or password' }),
                );
            }),
        );

        const user = userEvent.setup();

        render(<LandingPage />);

        // Go to sign in form
        await act(async () => {
            userEvent.click(screen.getByText('Sign in!'));
        });
        expect(
            await screen.findByText(/Sign in with username and password/i),
        ).toBeInTheDocument();

        // Fill out the form
        await act(async () => {
            await user.type(screen.getByLabelText('Email'), 'test@email.com');
            await user.type(screen.getByLabelText('Password'), '1234567');
        });
        await act(async () => {
            userEvent.click(screen.getByText('Sign in'));
            // await user.click(screen.getByRole('button', { name: 'Sign in' }));
        });

        // await waitFor(() => {
        //     expect(
        //         screen.getByText(/Wrong username or password/i),
        //     ).toBeInTheDocument();
        // });
        await vi.waitFor(
            async () => {
                console.log(screen.debug());
                expect(
                    screen.getByText(/Wrong username or password/i),
                ).toBeInTheDocument();
            },
            {
                timeout: 1000, // default is 1000
                interval: 900, // default is 50
            },
        );
    });

    it('displays verification errors when email input is empty', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        await act(async () => {
            userEvent.click(screen.getByTestId('sign-in-button'));
        });

        await waitFor(() => {
            expect(screen.getAllByText(/This field is required/i)).toHaveLength(
                2,
            );
        });
    });

    it('displays verification errors when email is incorrect', async () => {
        const user = userEvent.setup();

        render(<SignInForm setRegistrationScreenOn={() => false} />);

        await act(async () => {
            await user.type(screen.getByRole('textbox'), 'incorrectemail');
            await user.click(screen.getByTestId('sign-in-button'));
        });

        await waitFor(() => {
            expect(
                screen.getByText(/Invalid email address/i),
            ).toBeInTheDocument();
        });
    });

    it('displays verification errors when both email and password are empty', async () => {
        const user = userEvent.setup();

        render(<SignInForm setRegistrationScreenOn={() => false} />);

        await act(async () => {
            await user.click(screen.getByTestId('sign-in-button'));
        });

        await waitFor(() => {
            const errorMessages = screen.getAllByText(/required/i);
            expect(errorMessages).toHaveLength(2);
        });
    });
});

describe('<SignUpForm />', () => {
    test('checks if the signup form is displayed', async () => {
        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );
        expect(screen.getByText(/Sign up form/)).toBeInTheDocument();
        expect(screen.getByLabelText('Email *')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm Email *')).toBeInTheDocument();
        expect(screen.getByLabelText('Password *')).toBeInTheDocument();
        expect(screen.getByLabelText('Repeat password *')).toBeInTheDocument();
    });

    test('checks emails match', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await act(async () => {
            await user.type(screen.getByLabelText('Email *'), 'test@email.com');
            await user.type(
                screen.getByLabelText(/Confirm Email \*/),
                'xxx@email.com',
            );
            await user.click(screen.getByTestId('sign-up-button'));
        });

        await waitFor(() => {
            expect(screen.getByText('Emails must match')).toBeInTheDocument();
        });
    });

    test('checks passwords match', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await act(async () => {
            await user.type(screen.getByLabelText('Password *'), '12345');
            await user.type(
                screen.getByLabelText(/Repeat password \*/),
                '6789',
            );
            await user.click(screen.getByTestId('sign-up-button'));
        });

        await waitFor(() => {
            expect(
                screen.getByText('Passwords must match'),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when checkbox is not checked', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );
        await act(async () => {
            await user.type(screen.getByLabelText('Email *'), 'test@email.com');
            await user.type(
                screen.getByLabelText(/Confirm Email \*/),
                'test@email.com',
            );
            await user.type(screen.getByLabelText('Password *'), '12345');
            await user.type(
                screen.getByLabelText(/Repeat password \*/),
                '12345',
            );
            await user.click(screen.getByTestId('sign-up-button'));
        });

        await waitFor(() => {
            expect(screen.getAllByText(/This field is required/i)).toHaveLength(
                1,
            );
        });
    });

    test('displays verification errors when email confirmation input is empty', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await act(async () => {
            await user.type(screen.getByLabelText('Email *'), 'test@email.com');
            await user.type(screen.getByLabelText('Password *'), '12345');
            await user.type(
                screen.getByLabelText(/Repeat password \*/),
                '12345',
            );
            await user.click(screen.getAllByRole('checkbox')[0]);
            await user.click(screen.getByTestId('sign-up-button'));
        });

        await waitFor(() => {
            expect(screen.getAllByText(/Emails must match/i)).toHaveLength(1);
        });
    });

    test('displays verification errors when email is incorrect', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await act(async () => {
            await user.type(screen.getByLabelText('Email *'), 'incorrectemail');
            await user.click(screen.getByTestId('sign-up-button'));
        });

        await waitFor(() => {
            expect(
                screen.getByText(/Invalid email address/i),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when password in SignUp form is empty', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await act(async () => {
            await user.type(screen.getByLabelText('Email *'), 'test@email.com');
            await user.type(
                screen.getByLabelText(/Confirm Email \*/),
                'test@email.com',
            );
            await user.type(
                screen.getByLabelText(/Repeat password \*/),
                '12345',
            );
            await user.click(screen.getAllByRole('checkbox')[0]);
            await user.click(screen.getByTestId('sign-up-button'));
        });

        await waitFor(() => {
            expect(
                screen.getByText(/This field is required/i),
            ).toBeInTheDocument();
            expect(
                screen.getByText(/Passwords must match/i),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when both email, password and agreement checkbox are empty', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await act(async () => {
            await user.click(screen.getByTestId('sign-up-button'));
        });

        await waitFor(() => {
            const errorMessages = screen.getAllByText(/required/i);
            expect(errorMessages).toHaveLength(4);
        });
    });
});

describe('<ForgotPasswordForm />', () => {
    test('displays the forgot password link', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        expect(screen.getByText(/Forgot your password?/i)).toBeInTheDocument();
    });

    test('displays the forgot password window', async () => {
        const user = userEvent.setup();

        render(<SignInForm setRegistrationScreenOn={() => false} />);

        await act(async () => {
            await user.click(screen.getByTestId('forgot-password-link'));
        });

        expect(
            screen.getByTestId('forgot-password-dialog'),
        ).toBeInTheDocument();
    });

    test('displays verification errors when email is incorrect', async () => {
        const user = userEvent.setup();

        render(<SignInForm setRegistrationScreenOn={() => false} />);

        await act(async () => {
            await user.click(screen.getByTestId('forgot-password-link'));
        });

        await act(async () => {
            await user.type(screen.getByRole('textbox'), 'incorrectemail');
            await user.click(screen.getByTestId('send-reset-link'));
        });

        await waitFor(() => {
            expect(
                screen.getByText(/Invalid email address/i),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when email is empty', async () => {
        const user = userEvent.setup();

        render(<SignInForm setRegistrationScreenOn={() => false} />);

        await act(async () => {
            await user.click(screen.getByTestId('forgot-password-link'));
        });

        await act(async () => {
            await user.click(screen.getByTestId('send-reset-link'));
        });

        await waitFor(() => {
            expect(
                screen.getByText(/This field is required/i),
            ).toBeInTheDocument();
        });
    });
});
