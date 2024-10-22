import React, { useCallback, useEffect, useState } from 'react';
import {
    AppBar,
    Avatar,
    CssBaseline,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { DownloadButton } from '../DownloadButton';
import LinelistTable from '../LinelistTable';
import PivotTables from '../PivotTables';
import {
    Link,
    Route,
    Routes,
    useNavigate,
    Navigate,
    useLocation,
} from 'react-router-dom';
import { Theme } from '@mui/material/styles';

import { makeStyles } from 'tss-react/mui';

import AutomatedBackfill from '../AutomatedBackfill';
import AutomatedSourceForm from '../AutomatedSourceForm';
import BulkCaseForm from '../BulkCaseForm';
import CaseForm from '../CaseForm';
import AcknowledgmentsPage from '../AcknowledgmentsPage';
import EditCase from '../EditCase';
import GHListLogo from '../GHListLogo';
import LandingPage from '../landing-page/LandingPage';
import MenuIcon from '@mui/icons-material/Menu';
import Profile from '../Profile';
import SearchBar from '../SearchBar';
import SourceTable from '../SourceTable';
import TermsOfUse from '../TermsOfUse';
import UploadsTable from '../UploadsTable';
import Users from '../Users';
import ViewCase from '../ViewCase';
import clsx from 'clsx';
import { useCookieBanner } from '../../hooks/useCookieBanner';
import { MapLink } from '../../constants/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setFilterBreadcrumbs } from '../../redux/app/slice';
import {
    selectDiseaseName,
    selectEnv,
    selectIsLoading,
    selectVersion,
} from '../../redux/app/selectors';
import { getDiseaseName, getEnv, getVersion } from '../../redux/app/thunk';
import { getUserProfile, logout } from '../../redux/auth/thunk';
import { selectUser } from '../../redux/auth/selectors';
import { Role, User } from '../../api/models/User';
import PopupSmallScreens from '../PopupSmallScreens';
import Sidebar from '../Sidebar';
import Footer from '../Footer';
import { getReleaseNotesUrl, hasAnyRole } from '../util/helperFunctions';
import { theme } from '../../theme/theme';
import { setSearchQuery } from '../../redux/linelistTable/slice';
import { selectSearchQuery } from '../../redux/linelistTable/selectors';

const menuStyles = makeStyles()((theme) => ({
    link: {
        color: theme.custom.palette.link.color,
        fontWeight: 300,
    },
    divider: {
        marginTop: '1em',
        marginBottom: '1em',
    },
}));

const useStyles = makeStyles()((theme: Theme) => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
    },
    buttonLabel: {
        display: 'block',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    spacer: {
        flexGrow: 1,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    mapLink: {
        margin: '0 8px 0 16px',
        whiteSpace: 'nowrap',
    },
    hide: {
        display: 'none',
    },
    divider: {
        backgroundColor: '#0A7369',
        height: '1px',
        opacity: '0.2',
        margin: '24px 0',
        marginTop: '12px',
        width: '100%',
    },
    link: {
        marginTop: 12,
    },
    content: {
        flexGrow: 1,
        transition: theme.transitions.create(['margin', 'padding'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: 0,
        padding: '0 24px',
        width: '100%',
    },
    contentShift: {
        transition: theme.transitions.create(['margin', 'padding'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: theme.drawerWidth,
        width: `calc(100% - ${theme.drawerWidth}px)`,
    },
    searchBar: {
        flex: 1,
        marginLeft: theme.spacing(4),
        marginRight: theme.spacing(2),
    },
    avatar: {
        width: theme.spacing(3),
        height: theme.spacing(3),
    },
}));

function ProfileMenu(props: { user: User; version: string }): JSX.Element {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    useCallback((): void => {
        dispatch(getUserProfile());
    }, [user]);

    const { classes } = menuStyles();

    const releaseNotesUrl = getReleaseNotesUrl(props.version);

    return (
        <div>
            <PopupSmallScreens />
            <IconButton
                aria-controls="profile-menu"
                data-testid="profile-menu"
                aria-haspopup="true"
                onClick={handleClick}
                size="large"
            >
                <Avatar alt={props.user.email} src={props.user.picture} />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
                data-testid="profile-menu-dropdown"
            >
                <MenuItem
                    component={Link}
                    to="/profile"
                    onClick={handleClose}
                    className={classes.link}
                >
                    Profile
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        dispatch(logout());
                        // remove previous search query from local storage
                        localStorage.removeItem('searchQuery');
                    }}
                    className={classes.link}
                >
                    Logout
                </MenuItem>
                <Divider className={classes.divider} />
                <a
                    href="https://global.health/about/"
                    onClick={handleClose}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classes.link}
                >
                    <MenuItem>About Global.health</MenuItem>
                </a>
                <Link
                    to="/data-acknowledgments"
                    onClick={handleClose}
                    className={classes.link}
                >
                    <MenuItem>Data acknowledgments</MenuItem>
                </Link>
                <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href={import.meta.env.VITE_APP_DATA_DICTIONARY_LINK}
                    onClick={handleClose}
                    className={classes.link}
                >
                    <MenuItem>Data dictionary</MenuItem>
                </a>
                <a
                    href="https://github.com/globaldothealth/list#globalhealth-list"
                    rel="noopener noreferrer"
                    target="_blank"
                    onClick={handleClose}
                    className={classes.link}
                >
                    <MenuItem>View source on Github</MenuItem>
                </a>

                {props.version && (
                    <div>
                        <Divider className={classes.divider} />

                        <a
                            href={releaseNotesUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                            onClick={handleClose}
                            className={classes.link}
                        >
                            <MenuItem>Version: {props.version}</MenuItem>
                        </a>
                    </div>
                )}
            </Menu>
        </div>
    );
}

export interface ChipData {
    key: string;
    value: string;
}

export default function App(): JSX.Element {
    const dispatch = useAppDispatch();

    const CookieBanner = () => {
        const { initCookieBanner } = useCookieBanner();

        useEffect(() => {
            initCookieBanner();
        }, [initCookieBanner]);

        return null;
    };

    // Get current env, version and disease name
    useEffect(() => {
        dispatch(getEnv());
        dispatch(getVersion());
        dispatch(getDiseaseName());
    }, [dispatch]);

    const isLoadingUser = useAppSelector(selectIsLoading);
    const user = useAppSelector(selectUser);
    const env = useAppSelector(selectEnv);
    const appVersion = useAppSelector(selectVersion);
    const searchQuery = useAppSelector(selectSearchQuery);
    const diseaseName = useAppSelector(selectDiseaseName);

    const showMenu = useMediaQuery(theme.breakpoints.up('sm'));
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { classes } = useStyles();

    const savedSearchQuery = localStorage.getItem('searchQuery');

    // Update filter breadcrumbs
    useEffect(() => {
        if (!location.pathname.includes('/cases')) {
            dispatch(setFilterBreadcrumbs([]));
            return;
        }
        if (location.pathname === '/cases') {
            const searchParams = new URLSearchParams(location.search);
            const tempFilterBreadcrumbs: ChipData[] = [];
            searchParams.forEach((value, key) => {
                tempFilterBreadcrumbs.push({ key, value });
            });
            dispatch(setFilterBreadcrumbs(tempFilterBreadcrumbs));
        }
        //eslint-disable-next-line
    }, [location.search]);

    const getUser = useCallback((): void => {
        dispatch(getUserProfile());
    }, [dispatch]);

    const toggleDrawer = (): void => {
        setDrawerOpen(!drawerOpen);
    };

    const onModalClose = (): void => {
        let parsedSearchQuery: string = '';
        if (searchQuery.includes('?q=')) {
            parsedSearchQuery = `?q=${encodeURIComponent(searchQuery.split('?q=')[1])}`;
        } else if (searchQuery.includes('&q=')) {
            parsedSearchQuery = `${searchQuery.split('&q=')[0]}&q=${encodeURIComponent(searchQuery.split('&q=')[1])}`;
        } else {
            parsedSearchQuery = searchQuery;
        }

        navigate(
            {
                pathname:
                    location.state && location.state.lastLocation
                        ? location.state.lastLocation
                        : '/cases',
                search: parsedSearchQuery,
            },
            { state: { lastLocation: '/case/view' } },
        );
    };

    useEffect(() => {
        getUser();
    }, [getUser]);

    useEffect(() => {
        if (!user) return;

        setDrawerOpen(
            hasAnyRole(user, [Role.Admin, Role.Curator, Role.JuniorCurator]) &&
                showMenu,
        );
        //eslint-disable-next-line
    }, [user]);

    // Update search query based on stored search from landing page
    useEffect(() => {
        if (savedSearchQuery === null || savedSearchQuery === '') return;

        navigate({ pathname: '/cases', search: savedSearchQuery });

        // eslint-disable-next-line
    }, [savedSearchQuery]);

    // When user is redirected from map to this app we have to parse url search query
    useEffect(() => {
        if (
            location.pathname.includes('/cases/view') ||
            location.pathname.includes('/cases/edit') ||
            location.pathname === '/'
        )
            return;

        dispatch(setSearchQuery(decodeURIComponent(location.search)));

        // Save searchQuery to local storage not to lost it when user goes through auth process
        localStorage.setItem('searchQuery', location.search);

        //eslint-disable-next-line
    }, [location.search]);

    return (
        <div className={classes.root} ref={rootRef}>
            <CookieBanner />
            <CssBaseline />
            <AppBar position="fixed" elevation={0} className={classes.appBar}>
                <Toolbar>
                    {user &&
                        hasAnyRole(user, [
                            Role.Admin,
                            Role.Curator,
                            Role.JuniorCurator,
                        ]) && (
                            <IconButton
                                color="primary"
                                aria-label="toggle drawer"
                                onClick={toggleDrawer}
                                edge="start"
                                className={classes.menuButton}
                                data-testid="toggle-sidebar"
                                size="large"
                            >
                                <MenuIcon />
                            </IconButton>
                        )}
                    <GHListLogo />
                    {location.pathname === '/cases' && user ? (
                        <>
                            <div className={classes.searchBar}>
                                <SearchBar rootComponentRef={rootRef} />
                            </div>
                            <DownloadButton />
                        </>
                    ) : (
                        <span className={classes.spacer}></span>
                    )}

                    <Typography>
                        <a
                            className={classes.mapLink}
                            data-testid="mapLink"
                            href={MapLink[env]}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            G.h Map
                        </a>
                    </Typography>
                    {user && <ProfileMenu user={user} version={appVersion} />}
                </Toolbar>
            </AppBar>
            {user &&
                hasAnyRole(user, [
                    Role.Admin,
                    Role.Curator,
                    Role.JuniorCurator,
                ]) && <Sidebar drawerOpen={drawerOpen} />}
            <main
                className={clsx(classes.content, {
                    [classes.contentShift]: drawerOpen,
                })}
            >
                <div />
                <Routes>
                    <Route
                        path="/:url*(/+)"
                        element={
                            <Navigate to={location.pathname.slice(0, -1)} />
                        }
                    />
                    {user && (
                        <Route path="/pivot-tables" element={<PivotTables />} />
                    )}
                    {user && (
                        <Route path="/cases" element={<LinelistTable />} />
                    )}
                    {hasAnyRole(user, [Role.Curator, Role.JuniorCurator]) && (
                        <Route path="/sources" element={<SourceTable />} />
                    )}
                    {hasAnyRole(user, [Role.Curator]) && (
                        <Route path="/uploads" element={<UploadsTable />} />
                    )}
                    {user && <Route path="/profile" element={<Profile />} />}
                    {user && hasAnyRole(user, [Role.Admin]) && (
                        <Route
                            path="/users"
                            element={<Users onUserChange={getUser} />}
                        />
                    )}{' '}
                    {user && hasAnyRole(user, [Role.Curator]) && (
                        <Route
                            path="/sources/automated"
                            element={
                                <AutomatedSourceForm
                                    onModalClose={onModalClose}
                                />
                            }
                        />
                    )}
                    {user &&
                        hasAnyRole(user, [
                            Role.Curator,
                            Role.JuniorCurator,
                        ]) && (
                            <Route
                                path="/cases/bulk"
                                element={
                                    <BulkCaseForm onModalClose={onModalClose} />
                                }
                            />
                        )}
                    {user && hasAnyRole(user, [Role.Curator]) && (
                        <Route
                            path="/sources/backfill"
                            element={
                                <AutomatedBackfill
                                    onModalClose={onModalClose}
                                />
                            }
                        />
                    )}
                    {user &&
                        hasAnyRole(user, [
                            Role.Curator,
                            Role.JuniorCurator,
                        ]) && (
                            <Route
                                path="/cases/new"
                                element={
                                    <CaseForm
                                        onModalClose={onModalClose}
                                        diseaseName={diseaseName}
                                    />
                                }
                            />
                        )}
                    {user &&
                        hasAnyRole(user, [
                            Role.Curator,
                            Role.JuniorCurator,
                        ]) && (
                            <Route
                                path="/cases/edit/:id"
                                element={
                                    <EditCase
                                        onModalClose={onModalClose}
                                        diseaseName={diseaseName}
                                    />
                                }
                            />
                        )}
                    {user && (
                        <Route
                            path="/cases/view/:id"
                            element={
                                <ViewCase
                                    enableEdit={hasAnyRole(user, [
                                        Role.Curator,
                                        Role.JuniorCurator,
                                    ])}
                                    onModalClose={onModalClose}
                                />
                            }
                        />
                    )}
                    <Route
                        path="/data-acknowledgments"
                        element={<AcknowledgmentsPage />}
                    />
                    <Route path="/terms" element={<TermsOfUse />} />
                    <Route
                        path="/reset-password/:token/:id"
                        element={<LandingPage />}
                    />
                    <Route
                        path="/"
                        element={
                            user ? (
                                <Navigate
                                    to={{
                                        pathname: '/cases',
                                        search: savedSearchQuery || '',
                                    }}
                                    replace
                                />
                            ) : isLoadingUser ? (
                                <></>
                            ) : (
                                <LandingPage />
                            )
                        }
                    />
                    {/* Redirect any unavailable URLs to / after the user has loaded. */}
                    {!isLoadingUser && (
                        <Route path="*" element={<Navigate to="/" replace />} />
                    )}
                </Routes>
            </main>

            {user && <Footer drawerOpen={drawerOpen} />}
        </div>
    );
}
