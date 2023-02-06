import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
    setDeleteCasesDialogOpen,
    setRowsAcrossPagesSelected,
    setCasesSelected,
} from '../../redux/linelistTable/slice';
import {
    selectCasesSelected,
    selectCases,
    selectSearchQuery,
    selectTotalCases,
    selectRowsAcrossPages,
} from '../../redux/linelistTable/selectors';

import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Stack from '@mui/material/Stack';

import Header from './Header';

const EnhancedTableToolbar = () => {
    const dispatch = useAppDispatch();

    const selectedCases = useAppSelector(selectCasesSelected);
    const cases = useAppSelector(selectCases);
    const searchQuery = useAppSelector(selectSearchQuery);
    const totalCases = useAppSelector(selectTotalCases);
    const rowsAcrossPagesSelected = useAppSelector(selectRowsAcrossPages);
    const formRef = useRef<HTMLFormElement>(null);

    const [numSelectedCases, setNumSelectedCases] = useState(
        selectedCases.length,
    );

    useEffect(() => {
        setNumSelectedCases(selectedCases.length);
    }, [selectedCases]);

    const handleSelectAllRowsAcrossPagesClick = () => {
        if (rowsAcrossPagesSelected || numSelectedCases === totalCases) {
            dispatch(setRowsAcrossPagesSelected(false));
            dispatch(setCasesSelected([]));
            setNumSelectedCases(0);
        } else {
            dispatch(setRowsAcrossPagesSelected(cases.length < totalCases));
            // eslint-disable-next-line
            dispatch(
                setCasesSelected(
                    cases.map((caseObj) => caseObj.caseReference.id!),
                ),
            );
            setNumSelectedCases(totalCases);
        }
    };

    return (
        <Toolbar
            sx={{
                pl: { sm: numSelectedCases > 0 ? 2 : 0 },
                pr: { xs: 1, sm: 1 },
                ...(numSelectedCases > 0 && {
                    bgcolor: (theme) =>
                        theme.custom.palette.appBar.backgroundColor,
                }),
            }}
        >
            {numSelectedCases > 0 ? (
                <>
                    <Stack direction="row" spacing={2}>
                        <Typography color="white" variant="h6" component="div">
                            {rowsAcrossPagesSelected
                                ? totalCases
                                : numSelectedCases}{' '}
                            row
                            {numSelectedCases > 1 ? 's' : ''} selected
                        </Typography>

                        {searchQuery && searchQuery !== '' && (
                            <Button
                                variant="text"
                                sx={{ color: '#ffffff' }}
                                onClick={handleSelectAllRowsAcrossPagesClick}
                            >
                                {rowsAcrossPagesSelected ||
                                numSelectedCases === totalCases
                                    ? 'Unselect'
                                    : 'Select'}{' '}
                                all {totalCases} rows
                            </Button>
                        )}
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ marginLeft: '1rem' }}
                    >
                        <Tooltip
                            title="Download selected rows"
                            aria-label="download selected rows"
                        >
                            <>
                                <form
                                    hidden
                                    ref={formRef}
                                    method="POST"
                                    action="/api/cases/download"
                                >
                                    {selectedCases.map((caseId) => (
                                        <input
                                            readOnly
                                            name="caseIds[]"
                                            key={caseId}
                                            value={caseId}
                                        />
                                    ))}
                                </form>
                                <IconButton
                                    sx={{ color: 'white' }}
                                    onClick={() => {
                                        if (!formRef.current) return;

                                        formRef.current.submit();
                                    }}
                                >
                                    <FileDownloadOutlinedIcon />
                                </IconButton>
                            </>
                        </Tooltip>

                        <Tooltip title="Delete selected rows">
                            <IconButton
                                sx={{ color: 'white' }}
                                onClick={() =>
                                    dispatch(setDeleteCasesDialogOpen(true))
                                }
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </>
            ) : (
                <Header />
            )}
        </Toolbar>
    );
};

export default EnhancedTableToolbar;
