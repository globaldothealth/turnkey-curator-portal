import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchLinelistData } from '../../redux/linelistTable/thunk';
import {
    setCurrentPage,
    setRowsPerPage,
    setCasesSelected,
    setDeleteCasesDialogOpen,
    setRowsAcrossPagesSelected,
} from '../../redux/linelistTable/slice';
import {
    selectIsLoading,
    selectCases,
    selectCurrentPage,
    selectError,
    selectTotalCases,
    selectRowsPerPage,
    selectSort,
    selectCasesSelected,
    selectDeleteCasesDialogOpen,
    selectRefetchData,
    selectRowsAcrossPages,
} from '../../redux/linelistTable/selectors';
import { selectUser } from '../../redux/auth/selectors';
import { Link, useHistory, useLocation } from 'react-router-dom';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import Stack from '@mui/material/Stack';
import TableFooter from '@mui/material/TableFooter';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';

import renderDate from '../util/date';
import { createData, labels } from './helperFunctions';
import { LoaderContainer, StyledAlert } from './styled';
import { URLToSearchQuery } from '../util/searchQuery';
import { hasAnyRole, parseAgeRange } from '../util/helperFunctions';
import { Helmet } from 'react-helmet';

import Pagination from './Pagination';
import EnhancedTableToolbar from './EnhancedTableToolbar';
import { CaseDeleteDialog } from '../Dialogs/CaseDeleteDialog';
import { nameCountry } from '../util/countryNames';
import VerifiedIcon from '@mui/icons-material/CheckCircleOutline';
import { Role } from '../../api/models/User';

const dataLimit = 10000;

interface LocationState {
    lastLocation: string;
    newCaseIds: string[];
    editedCaseIds: string[];
    bulkMessage: string;
}

const LinelistTable = () => {
    const dispatch = useAppDispatch();
    const history = useHistory();
    const location = useLocation<LocationState>();

    const isLoading = useAppSelector(selectIsLoading);
    const cases = useAppSelector(selectCases);
    const currentPage = useAppSelector(selectCurrentPage);
    const totalCases = useAppSelector(selectTotalCases);
    const error = useAppSelector(selectError);
    const rowsPerPage = useAppSelector(selectRowsPerPage);
    const sort = useAppSelector(selectSort);
    const user = useAppSelector(selectUser);
    const casesSelected = useAppSelector(selectCasesSelected);
    const deleteCasesDialogOpen = useAppSelector(selectDeleteCasesDialogOpen);
    const refetchData = useAppSelector(selectRefetchData);
    const rowsAcrossPagesSelected = useAppSelector(selectRowsAcrossPages);

    const searchQuery = location.search;

    // Build query and fetch data
    useEffect(() => {
        const query =
            searchQuery !== '' ? `&q=${URLToSearchQuery(searchQuery)}` : '';

        const preparedQuery = `?page=${
            currentPage + 1
        }&limit=${rowsPerPage}&count_limit=${dataLimit}&sort_by=${
            sort.value
        }&order=${sort.order}${query}`;

        dispatch(fetchLinelistData(preparedQuery));
    }, [dispatch, currentPage, rowsPerPage, sort, searchQuery, refetchData]);

    // When user applies filters we should go back to the first page of results
    useEffect(() => {
        if (
            currentPage === 0 ||
            (location.state && location.state.lastLocation === '/case/view')
        )
            return;

        dispatch(setCurrentPage(0));
        // eslint-disable-next-line
    }, [dispatch, searchQuery]);

    const rows =
        cases &&
        cases.map((data) => {
            return createData(
                data._id || '',
                !!data.curators?.verifiedBy || false,
                nameCountry(data.location.countryISO3, data.location.country) ||
                    '-',
                data.location.region || '-',
                data.location.district || '-',
                data.location.place || '-',
                data.location.location || '-',
                renderDate(data.events.dateEntry) || '-',
                parseAgeRange(data.demographics.ageRange) || '-',
                data.demographics.gender || '-',
                data.events.outcome || '-',
                renderDate(data.events.dateHospitalization) || '-',
                renderDate(data.events.dateOnset) || '-',
                data.caseReference.sourceUrl || '-',
                data.caseStatus || '-',
            );
        });

    const handleChangePage = (
        event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        dispatch(setCurrentPage(newPage));
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        dispatch(setRowsPerPage(parseInt(event.target.value, 10)));
        dispatch(setCurrentPage(0));
    };

    const customPaginationLabel = ({
        from,
        to,
        count,
    }: {
        from: number;
        to: number;
        count: number;
    }) => {
        return `${from} - ${to} of ${count >= dataLimit ? 'many' : `${count}`}`;
    };

    const handleCaseClick = (caseId: string) => {
        history.push(`/cases/view/${caseId}`, {
            lastLocation: location.pathname,
        });
    };

    const handleSelectAllClick = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        if (event.target.checked) {
            const newSelected = rows.map((n) => n.caseId);
            dispatch(setCasesSelected(newSelected));
            return;
        }
        dispatch(setCasesSelected([]));
        dispatch(setRowsAcrossPagesSelected(false));
    };

    const handleCaseSelect = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        caseId: string,
    ) => {
        const selectedIndex = casesSelected.indexOf(caseId);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = [...casesSelected, caseId];
        } else {
            newSelected = casesSelected.filter((id) => id !== caseId);
        }

        dispatch(setCasesSelected(newSelected));

        // In order to stop opening case details after clicking on a checkbox
        event.stopPropagation();
    };

    const isSelected = (id: string) => casesSelected.indexOf(id) !== -1;

    return (
        <>
            <Helmet>
                <title>Global.health | Cases</title>
            </Helmet>

            {error && (
                <StyledAlert severity="error" sx={{ marginTop: '2rem' }}>
                    {error}
                </StyledAlert>
            )}

            {!location.state?.bulkMessage &&
                location.state?.newCaseIds &&
                location.state?.newCaseIds.length > 0 &&
                (location.state.newCaseIds.length === 1 ? (
                    <StyledAlert
                        variant="standard"
                        action={
                            <Link
                                to={`/cases/view/${location.state.newCaseIds}`}
                            >
                                <Button
                                    color="primary"
                                    size="small"
                                    data-testid="view-case-btn"
                                >
                                    VIEW
                                </Button>
                            </Link>
                        }
                    >
                        {`Case ${location.state.newCaseIds} added`}
                    </StyledAlert>
                ) : (
                    <StyledAlert variant="standard">
                        {`${location.state.newCaseIds.length} cases added`}
                    </StyledAlert>
                ))}
            {!location.state?.bulkMessage &&
                (location.state?.editedCaseIds?.length ?? 0) > 0 && (
                    <StyledAlert
                        variant="standard"
                        action={
                            <Link
                                to={`/cases/view/${location.state.editedCaseIds}`}
                            >
                                <Button color="primary" size="small">
                                    VIEW
                                </Button>
                            </Link>
                        }
                    >
                        {`Case ${location.state.editedCaseIds} edited`}
                    </StyledAlert>
                )}
            {location.state?.bulkMessage && (
                <StyledAlert variant="standard">
                    {location.state.bulkMessage}
                </StyledAlert>
            )}

            <EnhancedTableToolbar />

            <Paper
                sx={{
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                }}
                elevation={0}
            >
                {isLoading && (
                    <LoaderContainer>
                        <CircularProgress color="primary" />
                    </LoaderContainer>
                )}

                <TableContainer
                    sx={{
                        maxHeight:
                            'calc(100vh - 64px - 106px - 52px - 45px - 2rem)',
                    }}
                >
                    <Table
                        sx={{ minWidth: 650 }}
                        size="medium"
                        aria-label="Linelist table"
                        stickyHeader
                    >
                        <TableHead>
                            <TableRow>
                                {hasAnyRole(user, [
                                    Role.Admin,
                                    Role.Curator,
                                ]) && (
                                    <TableCell
                                        padding="checkbox"
                                        sx={{
                                            backgroundColor: '#fff',
                                        }}
                                    >
                                        <Checkbox
                                            color="primary"
                                            indeterminate={
                                                casesSelected.length > 0 &&
                                                casesSelected.length <
                                                    rows.length
                                            }
                                            checked={
                                                rows.length > 0 &&
                                                casesSelected.length ===
                                                    rows.length
                                            }
                                            onChange={handleSelectAllClick}
                                            inputProps={{
                                                'aria-label':
                                                    'select all cases',
                                            }}
                                        />
                                    </TableCell>
                                )}

                                {labels.map((label) => (
                                    <TableCell
                                        key={label}
                                        align="left"
                                        sx={{
                                            backgroundColor: '#fff',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length > 0 ? (
                                rows.map((row, idx) => (
                                    <TableRow
                                        key={row.caseId}
                                        sx={{
                                            '&:last-child td, &:last-child th':
                                                {
                                                    border: 0,
                                                },
                                            cursor: 'pointer',
                                        }}
                                        hover
                                        onClick={() =>
                                            handleCaseClick(row.caseId)
                                        }
                                    >
                                        {hasAnyRole(user, [
                                            Role.Admin,
                                            Role.Curator,
                                        ]) && (
                                            <>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        color="primary"
                                                        size="small"
                                                        checked={isSelected(
                                                            row.caseId,
                                                        )}
                                                        inputProps={{
                                                            'aria-labelledby': `${row.caseId} - checkbox`,
                                                            id: `checkbox${idx}`,
                                                        }}
                                                        onClick={(e) =>
                                                            handleCaseSelect(
                                                                e,
                                                                row.caseId,
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                            </>
                                        )}
                                        <TableCell align="left">
                                            {row.caseId}
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            data-testid="verification-status"
                                        >
                                            {row.verified && <VerifiedIcon />}
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            sx={{ minWidth: 100 }}
                                        >
                                            {row.dateEntry}
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            {row.caseStatus}
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            sx={{ minWidth: 100 }}
                                        >
                                            {row.country}
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            sx={{ minWidth: 100 }}
                                        >
                                            {row.place}
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            sx={{ minWidth: 100 }}
                                        >
                                            {row.location}
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            sx={{ minWidth: 100 }}
                                        >
                                            {row.age}
                                        </TableCell>
                                        <TableCell align="left">
                                            {row.gender}
                                        </TableCell>
                                        <TableCell align="left">
                                            {row.outcome}
                                        </TableCell>
                                        <TableCell align="left">
                                            {row.dateHospitalization}
                                        </TableCell>
                                        <TableCell align="left">
                                            {row.dateOnset}
                                        </TableCell>
                                        <TableCell align="left">
                                            {row.source}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell sx={{ padding: '1rem' }}>
                                        No records to display
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Stack>
                <Table>
                    <TableFooter>
                        <TableRow>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 20, 50, 100]}
                                colSpan={3}
                                count={totalCases}
                                rowsPerPage={rowsPerPage}
                                page={currentPage}
                                labelDisplayedRows={customPaginationLabel}
                                SelectProps={{
                                    inputProps: {
                                        'aria-label': 'rows per page',
                                    },
                                    native: true,
                                }}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                ActionsComponent={Pagination}
                            />
                        </TableRow>
                    </TableFooter>
                </Table>
            </Stack>

            <CaseDeleteDialog
                isOpen={deleteCasesDialogOpen}
                handleClose={() => dispatch(setDeleteCasesDialogOpen(false))}
                caseIds={rowsAcrossPagesSelected ? undefined : casesSelected}
                query={rowsAcrossPagesSelected ? searchQuery : undefined}
            />
        </>
    );
};

export default LinelistTable;
