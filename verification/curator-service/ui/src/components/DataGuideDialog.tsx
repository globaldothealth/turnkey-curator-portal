import React, { useEffect } from 'react';
import { Box, Portal, Theme, Typography } from '@mui/material';
import { withStyles } from 'tss-react/mui';
import { Close as CloseIcon } from '@mui/icons-material';
import Draggable, { ControlPosition } from 'react-draggable';

// As per this issue from react-draggable library: https://github.com/react-grid-layout/react-draggable/pull/648
declare module 'react-draggable' {
    export interface DraggableProps {
        children: React.ReactNode;
    }
}

type Props = {
    rootComponentRef: React.RefObject<HTMLDivElement>;
    triggerComponentRef: React.RefObject<HTMLButtonElement>;
    isOpen: boolean;
    onToggle: () => void;
    className?: string;
    classes?: Partial<
        Record<'root' | 'closeIcon' | 'title' | 'textSection', string>
    >;
};

// additional offsets to keep the position ideally below the data guide button
const LEFT_OFFSET = -16;
const TOP_OFFSET = 6;

const SearchGuideDialog = ({
    rootComponentRef,
    triggerComponentRef,
    isOpen,
    onToggle,
    classes,
}: Props): JSX.Element | null => {
    const [positionOffset, setPositionOffset] =
        React.useState<ControlPosition | null>(null);
    const nodeRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = triggerComponentRef.current;

        if (container) {
            const { left, bottom } = container.getBoundingClientRect();
            setPositionOffset({
                x: left + LEFT_OFFSET,
                y: bottom + TOP_OFFSET,
            });
        }
    }, [triggerComponentRef]);

    if (!isOpen || !positionOffset) {
        return null;
    }

    return (
        <Portal container={rootComponentRef.current}>
            <Draggable
                handle="#draggable-search-guide"
                bounds="body"
                defaultPosition={positionOffset}
                nodeRef={nodeRef}
                cancel="#close-guide-icon"
            >
                <div
                    ref={nodeRef}
                    className={classes?.root}
                    id="draggable-search-guide"
                >
                    <Box sx={{ position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
                            <CloseIcon
                                className={classes?.closeIcon}
                                onClick={onToggle}
                                data-testid="close-search-guide-button"
                                id="close-guide-icon"
                            />
                        </Box>
                        <Box sx={{ mb: 1 }}>
                            <Typography className={classes?.title}>
                                Welcome to Global.health Data!
                            </Typography>
                        </Box>
                        <Typography className={classes?.textSection}>
                            You can explore our line-list dataset by{' '}
                            <strong>filtering</strong>, <strong>sorting</strong>
                            , or <strong>searching</strong>.
                        </Typography>
                        <Typography className={classes?.textSection}>
                            <strong>To filter</strong>, click the "Filter"
                            button or a column header and enter parameters for
                            any of the available fields.
                        </Typography>
                        <Typography className={classes?.textSection}>
                            <strong>To sort</strong>, use the dropdown menu on
                            the left and choose ascending or descending.
                        </Typography>
                        <Typography className={classes?.textSection}>
                            <strong>For full-text search</strong>, enter any
                            combination of search terms. Rules for full-text
                            search:
                            <br />
                            <ul>
                                <li>
                                    Full-text search covers: occupation, admin0,
                                    admin1, admin2, admin3, sourceUrl, comment
                                    and caseStatus.
                                </li>
                                <li>
                                    Search terms must be exact (example:{' '}
                                    <b>
                                        <i>German</i>
                                    </b>{' '}
                                    will not match{' '}
                                    <b>
                                        <i>Germany</i>
                                    </b>
                                    ).
                                </li>
                                <li>
                                    Full-text search matches cases that contain
                                    any of the search terms, not a combination.
                                </li>
                                <li>
                                    To search for a combination of terms, wrap
                                    the combination in quotation marks (example:{' '}
                                    <b>
                                        <i>"Bus driver"</i>
                                    </b>
                                    ).
                                </li>
                                <li>
                                    No special characters apart from dot are
                                    allowed. Search terms with dot must be
                                    contained within quotation marks (example:{' '}
                                    <b>
                                        <i>"global.health"</i>
                                    </b>
                                    ).
                                </li>
                            </ul>
                        </Typography>
                        <Typography>
                            You can use the icons on the right to navigate
                            results and click on any individual record to see
                            more detailed case information.
                        </Typography>
                    </Box>
                </div>
            </Draggable>
        </Portal>
    );
};

const SearchGuideDialogStyled = withStyles(
    SearchGuideDialog,
    (theme: Theme) => ({
        root: {
            maxWidth: 520,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            cursor: 'move',
            position: 'absolute',
            zIndex: 1500,
            borderRadius: 5,
            padding: theme.spacing(4),
        },
        closeIcon: {
            width: 30,
            height: 30,
            cursor: 'pointer',
        },
        title: {
            fontFamily: 'Inter',
            fontSize: 22,
            fontWeight: 'bold',
        },
        subtitle: {
            fontSize: 18,
            fontWeight: 'bold',
        },
        list: {
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            padding: 0,
            fontSize: 16,

            '& > li': {
                flex: '0 0 33.3333%',
                listStyleType: 'none',
            },
        },
        textSection: {
            fontFamily: 'Inter',
            marginBottom: '1rem',
        },
    }),
);

export default SearchGuideDialogStyled;
