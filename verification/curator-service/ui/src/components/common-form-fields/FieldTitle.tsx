import { withStyles } from 'tss-react/mui';
import { HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import React from 'react';

import { AppTooltip } from './AppTooltip';

type FieldTitleProps = {
    title: string;
    tooltip?: string | JSX.Element;
    interactive?: boolean;
    widetooltip?: boolean;
    className?: string;
    classes?: Partial<Record<'container' | 'title', string>>;
};

function FieldTitle(props: FieldTitleProps): JSX.Element {
    const { classes } = props;

    return (
        <div className={classes?.container}>
            <div className={classes?.title}>
                {props.title.toLocaleUpperCase()}
            </div>
            {props.tooltip && (
                <AppTooltip
                    arrow
                    disableInteractive={props.interactive === false}
                    title={props.tooltip || ''}
                >
                    <HelpOutlineIcon fontSize="small" />
                </AppTooltip>
            )}
        </div>
    );
}

const FieldTitleStyled = withStyles(FieldTitle, () => ({
    container: {
        alignItems: 'center',
        display: 'flex',
        padding: '1em 0',
    },
    title: { marginRight: '1em' },
}));

export default FieldTitleStyled;
