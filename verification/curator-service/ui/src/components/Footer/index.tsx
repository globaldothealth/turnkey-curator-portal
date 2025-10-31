import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

import GitHubIcon from '@mui/icons-material/GitHub';
import XIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { useStyles } from './styled';
import PolicyLink from '../PolicyLink';
import FeedbackEmailDialog from '../FeedbackEmailDialog';
import Typography from '@mui/material/Typography';

interface FooterProps {
    drawerOpen: boolean;
}

const Footer = ({ drawerOpen }: FooterProps): JSX.Element => {
    const { classes } = useStyles();
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

    const openFeedbackModal = () => {
        setFeedbackModalOpen(true);
    };

    const closeFeedbackModal = () => {
        setFeedbackModalOpen(false);
    };

    return (
        <footer
            className={clsx(classes.root, {
                [classes.contentShift]: drawerOpen,
            })}
        >
            <section className={classes.socialMediaContainer}>
                <a
                    href="https://www.github.com/globaldothealth"
                    target="_blank"
                    rel="noreferrer"
                    className={classes.socialMediaButton}
                >
                    <GitHubIcon className="icon" />
                </a>

                <a
                    href="https://www.linkedin.com/company/globaldothealth"
                    target="_blank"
                    rel="noreferrer"
                    className={classes.socialMediaButton}
                >
                    <LinkedInIcon className="icon" />
                </a>
                <a
                    href="https://x.com/globaldothealth"
                    target="_blank"
                    rel="noreferrer"
                    className={classes.socialMediaButton}
                >
                    <XIcon className="icon" />
                </a>
            </section>

            <section>
                {/*<a*/}
                {/*    href={*/}
                {/*        import.meta.env.VITE_APP_DATA_DICTIONARY_LINK ||*/}
                {/*        'https://global.health/data-dictionary'*/}
                {/*    }*/}
                {/*    rel="noopener noreferrer"*/}
                {/*    target="_blank"*/}
                {/*    data-testid="dictionaryButton"*/}
                {/*    className={classes.link}*/}
                {/*>*/}
                {/*    Data dictionary*/}
                {/*</a>*/}
                {/*<Link*/}
                {/*    to="/data-acknowledgments"*/}
                {/*    className={classes.link}*/}
                {/*    data-testid="acknowledgmentsButton"*/}
                {/*>*/}
                {/*    Data acknowledgments*/}
                {/*</Link>*/}
                <a
                    href="https://global.health/terms-of-use"
                    rel="noopener noreferrer"
                    target="_blank"
                    className={classes.link}
                    data-testid="termsButton"
                >
                    Terms of use
                </a>
                {/*<a*/}
                {/*    href="https://global.health/privacy/"*/}
                {/*    rel="noopener noreferrer"*/}
                {/*    target="_blank"*/}
                {/*    className={classes.link}*/}
                {/*    data-testid="privacypolicybutton"*/}
                {/*>*/}
                {/*    Privacy policy*/}
                {/*</a>*/}
                <PolicyLink
                    type="cookie-policy"
                    classes={{
                        root: classes.link,
                    }}
                >
                    Cookie policy
                </PolicyLink>
                {/*<a*/}
                {/*    href="https://global.health/faqs/"*/}
                {/*    rel="noopener noreferrer"*/}
                {/*    target="_blank"*/}
                {/*    className={classes.link}*/}
                {/*>*/}
                {/*    FAQs*/}
                {/*</a>*/}
                {/*<a*/}
                {/*    href="https://github.com/globaldothealth/list/tree/main/api"*/}
                {/*    rel="noopener noreferrer"*/}
                {/*    target="_blank"*/}
                {/*    className={classes.link}*/}
                {/*>*/}
                {/*    API*/}
                {/*</a>*/}
                <Typography
                    display="inline"
                    className={classes.feedbackButton}
                    onClick={openFeedbackModal}
                >
                    Feedback
                </Typography>
                <FeedbackEmailDialog
                    isOpen={feedbackModalOpen}
                    closeFeedbackModal={closeFeedbackModal}
                />
            </section>
        </footer>
    );
};

export default Footer;
