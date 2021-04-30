import React, { useState, useEffect } from 'react';
import {
    Button,
    IconButton,
    InputAdornment,
    TextField,
    Theme,
    makeStyles,
    withStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import FilterListIcon from '@material-ui/icons/FilterList';
import HelpIcon from '@material-ui/icons/HelpOutline';
import SearchIcon from '@material-ui/icons/Search';
import clsx from 'clsx';
import SearchGuideDialog from './SearchGuideDialog';
import { useDebounce } from '../hooks/useDebounce';
import FiltersModal from './FiltersModal';
import { searchQueryToURL, URLToSearchQuery } from './util/searchQuery';
import { useLocation, useHistory } from 'react-router-dom';

const searchBarStyles = makeStyles((theme: Theme) => ({
    searchRoot: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        display: 'flex',
        alignItems: 'center',
        flex: 1,
    },
    divider: {
        backgroundColor: theme.palette.primary.main,
        height: '40px',
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
        width: '1px',
    },
    activeButton: {
        fontWeight: 'bold',
    },
}));

const StyledSearchTextField = withStyles((theme: Theme) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '8px',
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
                border: `1px solid  ${theme.palette.primary.main}`,
            },
            '&.Mui-focused fieldset': {
                border: `1px solid  ${theme.palette.primary.main}`,
            },
            '& #search-field': {
                minWidth: '100px',
            },
        },
    },
}))(TextField);

const StyledInputAdornment = withStyles({
    positionStart: {
        marginRight: 0,
    },
})(InputAdornment);

interface SearchBarProps {
    rootComponentRef: React.RefObject<HTMLDivElement>;
    filtersModalOpen: boolean;
    setFiltersModalOpen: (value: boolean) => void;
    activeFilterInput: string;
    setActiveFilterInput: (value: string) => void;
}

export default function SearchBar({
    rootComponentRef,
    filtersModalOpen,
    setFiltersModalOpen,
    activeFilterInput,
    setActiveFilterInput,
}: SearchBarProps): JSX.Element {
    const classes = searchBarStyles();
    const location = useLocation();
    const history = useHistory();

    const [isUserTyping, setIsUserTyping] = useState<boolean>(false);
    const [isSearchGuideOpen, setIsSearchGuideOpen] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>(
        location.search.includes('?q=')
            ? URLToSearchQuery(location.search)
            : '',
    );

    const guideButtonRef = React.useRef<HTMLButtonElement>(null);

    // Set search query debounce to 1000ms
    const debouncedSearch = useDebounce(searchInput, 2000);

    // Update search input based on search query
    useEffect(() => {
        if (!location.search.includes('?q=')) {
            setSearchInput('');
            return;
        }

        setSearchInput(URLToSearchQuery(location.search));
    }, [location.search]);

    // Apply filter parameters after delay
    useEffect(() => {
        if (!isUserTyping) return;

        setIsUserTyping(false);
        history.push({
            pathname: '/cases',
            search: searchQueryToURL(debouncedSearch),
        });
        //eslint-disable-next-line
    }, [debouncedSearch]);

    const toggleSearchGuide = async (): Promise<void> => {
        setIsSearchGuideOpen((isOpen) => !isOpen);
    };

    const handleKeyPress = (ev: React.KeyboardEvent<HTMLDivElement>): void => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            setIsUserTyping(false);
            history.push({
                pathname: '/cases',
                search: searchQueryToURL(searchInput),
            });
        }
    };

    return (
        <>
            <div className={classes.searchRoot}>
                <StyledSearchTextField
                    id="search-field"
                    data-testid="searchbar"
                    name="searchbar"
                    onKeyPress={handleKeyPress}
                    onChange={(event): void => {
                        setSearchInput(event.target.value);
                    }}
                    onKeyDown={() => {
                        if (!isUserTyping) {
                            setIsUserTyping(true);
                        }
                    }}
                    placeholder="Search"
                    value={searchInput}
                    variant="outlined"
                    fullWidth
                    InputProps={{
                        margin: 'dense',
                        startAdornment: (
                            <>
                                <StyledInputAdornment position="start">
                                    <Button
                                        color="primary"
                                        startIcon={<FilterListIcon />}
                                        className="filter-button"
                                        onClick={() =>
                                            setFiltersModalOpen(true)
                                        }
                                    >
                                        Filter
                                    </Button>
                                    <div className={classes.divider}></div>
                                </StyledInputAdornment>
                                <InputAdornment position="start">
                                    <Button
                                        color="primary"
                                        startIcon={<HelpIcon />}
                                        onClick={toggleSearchGuide}
                                        className={clsx({
                                            [classes.activeButton]: isSearchGuideOpen,
                                        })}
                                        ref={guideButtonRef}
                                    >
                                        Search guide
                                    </Button>
                                    <SearchGuideDialog
                                        isOpen={isSearchGuideOpen}
                                        onToggle={toggleSearchGuide}
                                        rootComponentRef={rootComponentRef}
                                        triggerComponentRef={guideButtonRef}
                                    />
                                    <div className={classes.divider}></div>
                                    <SearchIcon color="primary" />
                                </InputAdornment>
                            </>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                {searchInput && (
                                    <IconButton
                                        color="primary"
                                        aria-label="clear search"
                                        onClick={(): void => {
                                            setSearchInput('');
                                            history.push({
                                                pathname: '/cases',
                                                search: '',
                                            });
                                        }}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                )}
                            </InputAdornment>
                        ),
                    }}
                />
            </div>

            <FiltersModal
                isOpen={filtersModalOpen}
                handleClose={() => setFiltersModalOpen(false)}
                activeFilterInput={activeFilterInput}
                setActiveFilterInput={setActiveFilterInput}
            />
        </>
    );
}
