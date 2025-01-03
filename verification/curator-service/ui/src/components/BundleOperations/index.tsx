import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Checkbox,
    CircularProgress,
    Link,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TableHead,
    TablePagination,
    TableRow,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { Role } from '../../api/models/User';
import { CaseVerifyDialog } from '../Dialogs/CaseVerifyDialog';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../redux/auth/selectors';
import {
    selectIsLoading,
    selectCases,
    selectCurrentPage,
    selectError,
    selectTotalCases,
    selectRowsPerPage,
    selectSort,
    selectCasesSelected,
    selectRefetchData,
    selectRowsAcrossPages,
    selectVerifyCasesDialogOpen,
    selectVerifyCasesSuccess,
} from '../../redux/bundledCases/selectors';
import {
    setCurrentPage,
    setRowsPerPage,
    setCasesSelected,
    setVerifyCasesDialogOpen,
    setRowsAcrossPagesSelected,
} from '../../redux/bundledCases/slice';
import { fetchBundlesData } from '../../redux/bundledCases/thunk';
import { nameCountry } from '../util/countryNames';
import renderDate from '../util/date';
import { hasAnyRole, parseAgeRange } from '../util/helperFunctions';
import { URLToSearchQuery } from '../util/searchQuery';

import EnhancedTableToolbar from './EnhancedTableToolbar';
import { createData, labels } from './helperFunctions';
import Pagination from './Pagination';
import {
    BundleOperationsContainer,
    LoaderContainer,
    StyledAlert,
} from './styled';

const dataLimit = 10000;

const BundleOperations = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const isLoading = useAppSelector(selectIsLoading);
    const cases = useAppSelector(selectCases);
    const currentPage = useAppSelector(selectCurrentPage);
    const totalCases = useAppSelector(selectTotalCases);
    const error = useAppSelector(selectError);
    const rowsPerPage = useAppSelector(selectRowsPerPage);
    const sort = useAppSelector(selectSort);
    const user = useAppSelector(selectUser);
    const casesSelected = useAppSelector(selectCasesSelected);
    const verifyCasesDialogOpen = useAppSelector(selectVerifyCasesDialogOpen);
    const refetchData = useAppSelector(selectRefetchData);
    const rowsAcrossPagesSelected = useAppSelector(selectRowsAcrossPages);
    const verificationSuccess = useAppSelector(selectVerifyCasesSuccess);

    const searchQuery = location.search;

    // Build query and fetch data
    useEffect(() => {
        const query =
            searchQuery !== '' ? `&q=${URLToSearchQuery(searchQuery)}` : '';

        const preparedQuery = `?page=${
            currentPage + 1
        }&limit=${rowsPerPage}&count_limit=${dataLimit}&sort_by=${
            sort.value
        }&order=${sort.order}${query}`; //&verification_status=${false}

        dispatch(fetchBundlesData(preparedQuery));
    }, [
        dispatch,
        currentPage,
        rowsPerPage,
        sort,
        searchQuery,
        refetchData,
        verificationSuccess,
    ]);

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
        cases.map((data: any) => {
            return createData(
                data._id || '',
                data.caseCount,
                data.caseIds,
                renderDate(data.dateModified) || renderDate(data.dateCreated),
                data.modifiedBy || data.createdBy,
                data.caseStatus,
                nameCountry(data.countryISO3, data.country) || '-',
                data.admin1 || '-',
                data.admin2 || '-',
                data.admin3 || '-',
                data.location || '-',
                renderDate(data.dateEntry) || '-',
                renderDate(data.dateReported) || '-',
                parseAgeRange(data.ageRange) || '-',
                data.gender || '-',
                data.outcome || '-',
                renderDate(data.dateHospitalization) || '-',
                renderDate(data.dateOnset) || '-',
                data.sourceUrl || '-',
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

    const handleBundleClick = (bundleId: string) => {
        navigate(`/cases/bundle/view/${bundleId}`, {
            state: {
                lastLocation: location.pathname,
            },
        });
    };

    const handleSelectAllClick = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        if (event.target.checked) {
            const newSelected = rows.map((n) => n.caseBundleId);
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
        let newSelected: string[];

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

    const handleCaseClick = (caseId: number) => {
        navigate(`/cases/view/${caseId}`, {
            state: {
                lastLocation: location.pathname,
            },
        });
    };

    return (
        <BundleOperationsContainer>
            <Helmet>
                <title>Global.health | Cases</title>
            </Helmet>

            {error && (
                <StyledAlert severity="error" sx={{ marginTop: '2rem' }}>
                    {error}
                </StyledAlert>
            )}

            {!location.state?.bulkMessage && location.state?.editedBundleId && (
                <StyledAlert
                    variant="standard"
                    action={
                        <Link
                            onClick={() =>
                                handleBundleClick(location.state.editedBundleId)
                            }
                            style={{ cursor: 'pointer' }}
                        >
                            VIEW
                        </Link>
                    }
                >
                    {`Case bundle ${location.state.editedBundleId} edited`}
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
                        aria-label="Bundles table"
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
                                        key={row.caseBundleId}
                                        sx={{
                                            '&:last-child td, &:last-child th':
                                                {
                                                    border: 0,
                                                },
                                            cursor: 'pointer',
                                        }}
                                        hover
                                        onClick={() =>
                                            handleBundleClick(row.caseBundleId)
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
                                                            row.caseBundleId,
                                                        )}
                                                        inputProps={{
                                                            'aria-labelledby': `${row.caseBundleId} - checkbox`,
                                                            id: `checkbox${idx}`,
                                                        }}
                                                        onClick={(e) =>
                                                            handleCaseSelect(
                                                                e,
                                                                row.caseBundleId,
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                            </>
                                        )}
                                        <TableCell align="left">
                                            {row.caseBundleId}
                                        </TableCell>
                                        <TableCell align="left">
                                            {row.caseCount}
                                        </TableCell>
                                        <TableCell align="left">
                                            <Accordion
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <AccordionSummary
                                                    expandIcon={
                                                        <ExpandMoreIcon />
                                                    }
                                                    aria-controls="panel1-content"
                                                    id="panel1-header"
                                                >
                                                    Case IDs
                                                </AccordionSummary>
                                                <AccordionDetails
                                                    style={{
                                                        width: '200px',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'normal',
                                                    }}
                                                >
                                                    {row.casesInBundle.map(
                                                        (caseId) => (
                                                            <div
                                                                style={{
                                                                    display:
                                                                        'inline',
                                                                }}
                                                                key={caseId}
                                                            >
                                                                <Link
                                                                    onClick={() =>
                                                                        handleCaseClick(
                                                                            caseId,
                                                                        )
                                                                    }
                                                                >
                                                                    {caseId}
                                                                </Link>
                                                                {'\t'}
                                                            </div>
                                                        ),
                                                    )}
                                                </AccordionDetails>
                                            </Accordion>
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            sx={{ minWidth: 100 }}
                                        >
                                            {row.dateModified}
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            sx={{ minWidth: 100 }}
                                        >
                                            {row.lastModifiedBy}
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            {row.caseBundleStatus}
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            sx={{ minWidth: 100 }}
                                        >
                                            {row.dateEntry}
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            sx={{ minWidth: 100 }}
                                        >
                                            {row.dateReported}
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
                                            {row.admin1}
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            sx={{ minWidth: 100 }}
                                        >
                                            {row.admin2}
                                        </TableCell>
                                        <TableCell
                                            align="left"
                                            sx={{ minWidth: 100 }}
                                        >
                                            {row.admin3}
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

            <CaseVerifyDialog
                isOpen={verifyCasesDialogOpen}
                handleClose={() => dispatch(setVerifyCasesDialogOpen(false))}
                caseBundleIds={
                    rowsAcrossPagesSelected ? undefined : casesSelected
                }
                query={rowsAcrossPagesSelected ? searchQuery : undefined}
            />
        </BundleOperationsContainer>
    );
};

export default BundleOperations;
