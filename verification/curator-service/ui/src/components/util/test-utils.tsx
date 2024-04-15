import React, { ReactElement } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { theme } from '../../theme/theme';
// Import your own reducer
import store, { rootReducer, RootState } from '../../redux/store';

interface CustomOptions {
    initialState?: RootState;
    store?: typeof store;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderOptions?: any;
    initialRoute?: string;
}

function render(ui: ReactElement, options?: CustomOptions) {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: options?.initialState,
    });

    const history = createMemoryHistory();
    if (options?.initialRoute) {
        history.push(options.initialRoute);
    }

    const renderOptions = options && options.renderOptions;

    function Wrapper(props: { children: ReactElement }) {
        return (
            <Provider store={store}>
                <Router>
                    <StyledEngineProvider injectFirst>
                        <ThemeProvider theme={theme}>
                            {props.children}
                        </ThemeProvider>
                    </StyledEngineProvider>
                </Router>
            </Provider>
        );
    }
    return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// re-export everything
export * from '@testing-library/react';
// override render method
export { render };
