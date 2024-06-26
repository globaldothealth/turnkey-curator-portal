import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
    selectIsLoading,
    selectTotalCases,
} from '../../redux/linelistTable/selectors';
import { deleteCases } from '../../redux/linelistTable/thunk';

interface CaseDeleteDialogProps {
    isOpen: boolean;
    handleClose: () => void;
    caseIds: string[] | undefined;
    query: string | undefined;
}

export const CaseDeleteDialog = ({
    isOpen,
    handleClose,
    caseIds,
    query,
}: CaseDeleteDialogProps) => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const isLoading = useAppSelector(selectIsLoading);
    const totalCases = useAppSelector(selectTotalCases);

    const renderTitle = () => {
        if (caseIds) {
            return `Are you sure you want to delete ${
                caseIds.length === 1 ? '1 case' : `${caseIds.length} cases`
            }?`;
        } else {
            return `Are you sure you want to delete ${totalCases} cases?`;
        }
    };

    const renderContent = () => {
        if (caseIds) {
            return `${
                caseIds.length === 1 ? '1 case' : `${caseIds.length} cases`
            } will be permanently deleted.`;
        } else {
            return `${totalCases} cases will be permanently deleted.`;
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            // Stops the click being propagated to the table which
            // would trigger the onRowClick action.
            onClick={(e): void => e.stopPropagation()}
        >
            <DialogTitle>{renderTitle()}</DialogTitle>
            <DialogContent>
                <DialogContentText>{renderContent()}</DialogContentText>
            </DialogContent>
            <DialogActions>
                {isLoading ? (
                    <CircularProgress
                        sx={{ marginRight: theme.spacing(2), padding: '6px' }}
                    />
                ) : (
                    <>
                        <Button onClick={handleClose} color="primary" autoFocus>
                            Cancel
                        </Button>

                        <Button
                            onClick={() =>
                                dispatch(deleteCases({ caseIds, query }))
                            }
                            color="primary"
                        >
                            Yes
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};
