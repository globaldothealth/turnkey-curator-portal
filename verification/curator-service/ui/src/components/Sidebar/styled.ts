import { Theme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

export const useStyles = makeStyles()((theme: Theme) => ({
    link: {
        color: theme.custom.palette.link.color,
    },
    divider: {
        backgroundColor: '#0A7369',
        height: '1px',
        opacity: '0.2',
        margin: '24px 0',
        marginTop: '12px',
        width: '100%',
    },
    drawer: {
        width: theme.drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        backgroundColor: '#ECF3F0',
        border: 'none',
        width: theme.drawerWidth,
        marginTop: '64px',
    },
    drawerContents: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        marginLeft: '24px',
        marginRight: '32px',
    },
    createNewButton: {
        margin: '12px 0',
        width: '100%',
    },
    createNewIcon: {
        marginRight: '12px',
    },
    diseaseTitle: {
        fontSize: '28px',
        marginLeft: '14px',
        marginTop: '8px',
    },
    spacer: {
        flexGrow: 1,
    },
    lastLink: {
        marginBottom: 24,
    },
}));
