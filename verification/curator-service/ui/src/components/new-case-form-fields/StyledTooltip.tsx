import React, { FunctionComponent } from 'react';
import { makeStyles } from 'tss-react/mui';

const styles = makeStyles()(() => ({
    tooltip: {
        width: '300px',
        padding: '5px',
        '& >ul': {
            listStyle: 'none',
            margin: 0,
            padding: 0,
        },
        '& li': {
            marginBottom: '8px',
            '& >ul': {
                listStyle: 'bullet',
                margin: '0 0 8px 20px',
                padding: 0,
            },
        },
    },
    wideTooltip: {
        width: `700px`,
        padding: '5px',
        '& >ul': {
            listStyle: 'none',
            margin: 0,
            padding: 0,
        },
        '& li': {
            marginBottom: '8px',
            '& >ul': {
                listStyle: 'bullet',
                margin: '0 0 8px 20px',
                padding: 0,
            },
        },
    },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const StyledTooltip: FunctionComponent<any> = ({ children, wide }) => {
    const { classes } = styles();

    if (wide) {
        return <div className={`${classes.wideTooltip}`}>{children}</div>;
    }
    return <div className={`${classes.tooltip}`}>{children}</div>;
};

export default StyledTooltip;
