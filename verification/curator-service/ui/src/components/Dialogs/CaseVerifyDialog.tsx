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
    selectVerifyCasesLoading,
    selectVerifyCasesSuccess,
} from '../../redux/bundledCases/selectors';
import { verifyCaseBundle } from '../../redux/bundledCases/thunk';
import {useEffect} from "react";

interface CaseDeleteDialogProps {
    isOpen: boolean;
    handleClose: () => void;
    caseBundleIds: string[] | undefined;
    query: string | undefined;
}

export const CaseVerifyDialog = ({
    isOpen,
    handleClose,
    caseBundleIds,
    query,
}: CaseDeleteDialogProps) => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const isLoading = useAppSelector(selectIsLoading);
    const totalCases = useAppSelector(selectTotalCases);
    const verificationLoading = useAppSelector(selectVerifyCasesLoading);

    const renderTitle = () => {
        if (caseBundleIds) {
            return `Verify ${
                caseBundleIds.length === 1 ? '1 case bundle' : `${caseBundleIds.length} case bundles`
            }?`;
        } else {
            return `Verify ${totalCases} case bundles?`;
        }
    };

    const renderContent = () => {
        if (caseBundleIds) {
            return `${
                caseBundleIds.length === 1 ? '1 case bundle' : `${caseBundleIds.length} case bundles`
            } will marked as verified.`;
        } else {
            return `${totalCases} case bundles will be marked as verified.`;
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
                        <Button onClick={handleClose} color="primary" autoFocus disabled={verificationLoading}>
                            Cancel
                        </Button>

                        <Button
                            onClick={() =>
                                dispatch(verifyCaseBundle({ caseBundleIds, query }))
                            }
                            data-testid="confirm-case-bundles-verification-button"
                            color="primary"
                        >
                            {verificationLoading ? <CircularProgress size='1rem'/> : 'Yes'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};
