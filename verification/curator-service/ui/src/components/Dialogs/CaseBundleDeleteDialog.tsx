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
import { deleteCaseBundles } from '../../redux/bundledCases/thunk';

interface CaseBundleDeleteDialogProps {
    isOpen: boolean;
    handleClose: () => void;
    bundleIds: string[] | undefined;
    query: string | undefined;
}

export const CaseBundleDeleteDialog = ({
    isOpen,
    handleClose,
    bundleIds,
    query,
}: CaseBundleDeleteDialogProps) => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const isLoading = useAppSelector(selectIsLoading);
    const totalCases = useAppSelector(selectTotalCases);

    const renderTitle = () => {
        if (bundleIds) {
            return `Are you sure you want to delete ${
                bundleIds.length === 1
                    ? '1 case bundle'
                    : `${bundleIds.length} case bundles`
            }?`;
        } else {
            return `Are you sure you want to delete ${totalCases} case bundles?`;
        }
    };

    const renderContent = () => {
        if (bundleIds) {
            return `${
                bundleIds.length === 1
                    ? '1 case bundle'
                    : `${bundleIds.length} case bundles`
            } will be permanently deleted.`;
        } else {
            return `${totalCases} case bundles will be permanently deleted.`;
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
                                dispatch(
                                    deleteCaseBundles({ bundleIds, query }),
                                )
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
