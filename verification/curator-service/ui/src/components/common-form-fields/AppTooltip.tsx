import { Tooltip } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { withStyles } from 'tss-react/mui';

export const AppTooltip = withStyles(Tooltip, (theme: Theme) => ({
    arrow: {
        color: theme.palette.primary.main,
    },
    tooltip: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        boxShadow: theme.shadows[1],
        fontSize: 16,
        fontWeight: 'normal',
        padding: '1rem',

        maxWidth: 'fit-content',
        '& button': {
            background: 'unset',
            border: 'none',
            fontWeight: 'bold',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0',
            borderBottom: '1px dotted white',
        },
    },
}));
