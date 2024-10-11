import { styled } from '@mui/material/styles';
import { Alert, MenuItem } from '@mui/material';

export const LoaderContainer = styled('div')(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 1000,
}));

export const StyledAlert = styled(Alert)(() => ({
    marginTop: '2rem',
}));

export const ActionMenuItem = styled(MenuItem)(({ theme }) => ({
    color: theme.custom.palette.link.color,
    fontWeight: 'light',
}));

export const BulkVerificationContainer = styled('div')(() => ({
    marginTop: '64px',
}));
