import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Highlighter from 'react-highlight-words';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Scroll from 'react-scroll';
import { makeStyles } from 'tss-react/mui';
import {
    Close as CloseIcon,
    EditOutlined as EditIcon,
    CheckCircleOutline as VerifyIcon,
    DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Button,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    LinearProgress,
    Link,
    Paper,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Day0Case, Outcome, YesNo } from '../api/models/Day0Case';
import { Role } from '../api/models/User';
import AppModal from './AppModal';
import renderDate from './util/date';
import createHref from './util/links';
import { selectFilterBreadcrumbs } from '../redux/app/selectors';
import { selectUser } from '../redux/auth/selectors';
import { selectSearchQuery } from '../redux/linelistTable/selectors';
import { nameCountry } from './util/countryNames';
import { parseAgeRange } from './util/helperFunctions';
import { useAppDispatch } from '../hooks/redux';
import { verifyCaseBundle } from '../redux/bundledCases/thunk';
import {
    selectVerifyCasesLoading,
    selectVerifyCasesSuccess,
} from '../redux/bundledCases/selectors';
import { LoadingButton } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const styles = makeStyles()(() => ({
    errorMessage: {
        height: 'fit-content',
        width: '100%',
    },
}));

interface Props {
    enableEdit?: boolean;
    onModalClose: () => void;
}

export default function ViewBundle(props: Props): JSX.Element {
    const { id } = useParams();
    const [cases, setCases] = useState<Day0Case[]>();
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>();

    useEffect(() => {
        setLoading(true);
        axios
            .get<Day0Case[]>(`/api/cases/bundled/${id}`)
            .then((resp) => {
                setCases(resp.data);
                setErrorMessage(undefined);
            })
            .catch((e) => {
                setCases([]);
                setErrorMessage(e.response?.data?.message || e.toString());
            })
            .finally(() => setLoading(false));
    }, [id]);

    const verifyCase = (
        onSuccess: () => void,
        onError: (errorMessage: string) => void,
        caseId: string,
        verifierEmail: string,
    ) => {
        if (caseId && verifierEmail) {
            setLoading(true);
            axios
                .post(`/api/cases/verify/bundled/${caseId}`, {
                    email: verifierEmail,
                })
                .then((resp) => {
                    setCases(resp.data);
                    onSuccess();
                })
                .catch((e) => {
                    onError(e.response?.data?.message || e.toString());
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    };

    const { classes } = styles();

    return (
        <AppModal title="Case bundle details" onModalClose={props.onModalClose}>
            {loading && <LinearProgress />}
            {errorMessage && (
                <Alert
                    className={classes.errorMessage}
                    elevation={6}
                    variant="filled"
                    severity="error"
                >
                    {errorMessage}
                </Alert>
            )}
            {cases && cases.length > 0 && (
                <CaseDetails
                    bundleId={id || ''}
                    cases={cases || []}
                    enableEdit={props.enableEdit}
                    verifyCase={verifyCase}
                />
            )}
        </AppModal>
    );
}
interface CaseDetailsProps {
    bundleId: string;
    cases: Day0Case[];
    verifyCase: (
        onSuccess: () => void,
        onError: (errorMessage: string) => void,
        caseId: string,
        userEmail: string,
    ) => void;
    enableEdit?: boolean;
}

const useStyles = makeStyles()((theme) => ({
    paper: {
        background: theme.palette.background.paper,
        marginTop: '1em',
    },
    caseLink: {
        // marginRight: '10px',
        cursor: 'pointer',
    },
    caseTitle: {
        marginTop: '1em',
        marginBottom: '1em',
        fontFamily: 'Inter',
    },
    grid: {
        margin: '1em',
    },
    sectionTitle: {
        margin: '1em',
    },
    container: {
        marginTop: '1em',
        marginBottom: '1em',
    },
    actionButton: {
        marginLeft: '1em',
    },
    verifyBtn: {
        marginLeft: '1em',
    },
    navMenu: {
        position: 'fixed',
        lineHeight: '2em',
        width: '10em',
        textTransform: 'uppercase',
    },
    alert: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.spacing(1),
        marginTop: theme.spacing(1),
    },
    casebox: {
        paddingRight: '20px',
        wordBreak: 'break-all',
    },
    breadcrumbChip: {
        margin: theme.spacing(0.5),
        marginRight: '8px',
    },
    dialogContainer: {
        height: '40%',
    },
    dialogTitle: {
        display: 'flex',
    },
    closeButton: {
        position: 'absolute',
        right: 8,
        top: 8,
    },
    verifyDialogBtn: {
        margin: '1em',
    },
}));

function CaseDetails(props: CaseDetailsProps): JSX.Element {
    const theme = useTheme();
    const navigate = useNavigate();
    const showNavMenu = useMediaQuery(theme.breakpoints.up('sm'));
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const { classes } = useStyles();
    const dispatch = useAppDispatch();
    const verificationLoading = useSelector(selectVerifyCasesLoading);
    const verificationSuccess = useSelector(selectVerifyCasesSuccess);
    useEffect(() => {
        if (verificationSuccess) {
            setVerifyDialogOpen(false);
        }
    }, [verificationSuccess]);
    const unverified = props.cases.some((c) => !c.curators?.verifiedBy);
    const { bundleId } = props;
    const caseData = props.cases[0];

    const scrollTo = (name: string): void => {
        Scroll.scroller.scrollTo(name, {
            duration: 100,
            smooth: true,
            containerId: 'scroll-container',
        });
    };

    const handleCaseClick = (caseId: string) => {
        navigate(`/cases/view/${caseId}`, {
            state: {
                lastLocation: location.pathname,
            },
        });
    };

    const handleEditBundleClick = (bundleId: string) => {
        navigate(`/cases/bundle/edit/${bundleId}`, {
            state: {
                lastLocation: location.pathname,
            },
        });
    };

    const handleDeleteBundleClick = (bundleId: string) => {
        // navigate(`/cases/bundle/edit/${bundleId}`, {
        //     state: {
        //         lastLocation: location.pathname,
        //     },
        // });
    };

    const searchedKeywords = useSelector(selectSearchQuery);
    const filtersBreadcrumb = useSelector(selectFilterBreadcrumbs);
    const user = useSelector(selectUser);

    return (
        <>
            {showNavMenu && (
                <nav className={classes.navMenu}>
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('curators')}
                    >
                        curators
                    </Button>
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('case-data')}
                    >
                        case data
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('location')}
                    >
                        location
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('event-history')}
                    >
                        event history
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('demographics')}
                    >
                        demographics
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('symptoms')}
                    >
                        symptoms
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('transmission')}
                    >
                        transmission
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('travel-history')}
                    >
                        travel history
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('pathogens')}
                    >
                        pathogens
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('vaccines')}
                    >
                        vaccines
                    </Button>
                </nav>
            )}
            <div
                className={classes.container}
                style={{
                    marginLeft: showNavMenu ? '10em' : '0',
                }}
            >
                {searchedKeywords && (
                    <>
                        <Chip
                            label="Searched query:"
                            color="primary"
                            className={classes.breadcrumbChip}
                        />

                        {filtersBreadcrumb.map((breadcrumb) => (
                            <Chip
                                key={breadcrumb.key}
                                label={`${breadcrumb.key} - ${breadcrumb.value}`}
                                className={classes.breadcrumbChip}
                            />
                        ))}
                    </>
                )}
                <Typography className={classes.caseTitle} variant="h5">
                    Case bundle {bundleId}
                    {props.cases.length > 0 &&
                        unverified &&
                        user?.roles.includes(Role.Curator) && (
                            <>
                                <Dialog
                                    open={verifyDialogOpen}
                                    className={classes.dialogContainer}
                                    id="popup-small-screens"
                                >
                                    <DialogTitle
                                        className={classes.dialogTitle}
                                    >
                                        Are you sure?
                                        <IconButton
                                            aria-label="close"
                                            onClick={() =>
                                                setVerifyDialogOpen(false)
                                            }
                                            className={classes.closeButton}
                                            id="small-screens-popup-close-btn"
                                            size="large"
                                            data-testid="verify-dialog-close-button"
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </DialogTitle>
                                    <DialogContent dividers>
                                        <Typography gutterBottom>
                                            Before verifying make sure that all
                                            the case data is valid.
                                        </Typography>
                                    </DialogContent>
                                    <LoadingButton
                                        data-testid="verify-dialog-confirm-button"
                                        variant="contained"
                                        color="primary"
                                        className={classes.verifyDialogBtn}
                                        endIcon={<VerifyIcon />}
                                        onClick={() =>
                                            props.verifyCase(
                                                () =>
                                                    setVerifyDialogOpen(false),
                                                (errorMessage: string) => {
                                                    console.log(errorMessage);
                                                },
                                                bundleId || '',
                                                user.email || '',
                                            )
                                        }
                                        loading={verificationLoading}
                                    >
                                        Verify
                                    </LoadingButton>
                                </Dialog>
                                <Button
                                    data-testid="verify-button"
                                    variant="outlined"
                                    color="primary"
                                    className={classes.verifyBtn}
                                    endIcon={<VerifyIcon />}
                                    onClick={() => setVerifyDialogOpen(true)}
                                >
                                    Verify
                                </Button>
                            </>
                        )}
                    {props.enableEdit && (
                        <Button
                            data-testid="edit-button"
                            variant="outlined"
                            color="primary"
                            className={classes.actionButton}
                            endIcon={<EditIcon />}
                            onClick={() =>
                                handleEditBundleClick(props.bundleId || '')
                            }
                        >
                            Edit
                        </Button>
                    )}
                    {props.enableEdit && (
                        <Button
                            data-testid="delete-button"
                            variant="outlined"
                            color="primary"
                            className={classes.actionButton}
                            endIcon={<DeleteIcon />}
                            onClick={() =>
                                handleDeleteBundleClick(props.bundleId || '')
                            }
                        >
                            Delete
                        </Button>
                    )}
                </Typography>
                <Accordion onClick={(e) => e.stopPropagation()}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1-content"
                        id="panel1-header"
                    >
                        Contains {props.cases.length} case
                        {props.cases.length > 1 ? 's' : ''}
                    </AccordionSummary>
                    <AccordionDetails
                        style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'normal',
                        }}
                    >
                        {props.cases.map((c) => (
                            <div key={c._id} style={{ display: 'inline' }}>
                                <Link
                                    onClick={() => handleCaseClick(c._id || '')}
                                    className={classes.caseLink}
                                >
                                    {c._id}
                                </Link>
                                {'\t'}
                            </div>
                        ))}
                    </AccordionDetails>
                </Accordion>
                {/* CURATORS */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="curators"
                        className={classes.casebox}
                    />
                    <Typography
                        className={classes.sectionTitle}
                        variant="overline"
                    >
                        Curators
                    </Typography>
                    <Grid container className={classes.grid}>
                        <RowHeader title="Created by" />
                        <RowContent
                            content={caseData.curators?.createdBy.email}
                        />

                        <RowHeader title="Verified by" />
                        <RowContent
                            content={
                                caseData.curators?.verifiedBy
                                    ? caseData.curators?.verifiedBy.name
                                        ? caseData.curators?.verifiedBy.name
                                        : caseData.curators?.verifiedBy.email
                                    : 'Not verified'
                            }
                        />
                    </Grid>
                </Paper>
                {/* CASE DATA */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="case-data"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Case data
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Case status" />
                            <RowContent content={caseData.caseStatus} />

                            <RowHeader title="Data source" />
                            <RowContent
                                content={
                                    caseData.caseReference?.sourceUrl || ''
                                }
                                isLink
                                linkComment={
                                    caseData.caseReference?.isGovernmentSource
                                        ? 'Government Source'
                                        : undefined
                                }
                            />
                            {caseData.caseReference.additionalSources &&
                                caseData.caseReference.additionalSources
                                    .length > 0 &&
                                caseData.caseReference.additionalSources.map(
                                    (source, idx) => (
                                        <>
                                            <RowHeader
                                                title={`Additional source ${idx + 2}`}
                                            />
                                            <RowContent
                                                content={source.sourceUrl || ''}
                                                isLink
                                                linkComment={
                                                    source.isGovernmentSource
                                                        ? 'Government Source'
                                                        : undefined
                                                }
                                            />
                                        </>
                                    ),
                                )}

                            <RowHeader title="Data upload IDs" />
                            <RowContent
                                content={
                                    caseData.caseReference?.uploadIds?.join(
                                        ', ',
                                    ) || ''
                                }
                            />

                            <RowHeader title="Date of creation" />
                            <RowContent
                                content={renderDate(caseData.events.dateEntry)}
                            />

                            <RowHeader title="Reported date" />
                            <RowContent
                                content={renderDate(
                                    caseData.events.dateReported,
                                )}
                            />

                            <RowHeader title="Date of edit" />
                            <RowContent
                                content={renderDate(
                                    caseData.events.dateLastModified,
                                )}
                            />
                            <RowHeader title="Curator's comment" />
                            <RowContent
                                content={caseData.comment}
                                isMultiline
                            />
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* LOCATION */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element name="location" className={classes.casebox}>
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Location
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Geo resolution" />
                            <RowContent
                                content={`${caseData.location.geoResolution}`}
                            />
                            <RowHeader title="Country" />
                            <RowContent
                                content={
                                    caseData.location.countryISO3
                                        ? nameCountry(
                                              caseData.location.countryISO3,
                                              caseData.location.country,
                                          )
                                        : ''
                                }
                            />

                            <RowHeader title="Admin1" />
                            <RowContent content={caseData.location.admin1} />

                            <RowHeader title="Admin2" />
                            <RowContent content={caseData.location.admin2} />

                            <RowHeader title="Admin3" />
                            <RowContent content={caseData.location.admin3} />

                            <RowHeader title="Location" />
                            <RowContent content={caseData.location.location} />

                            <RowHeader title="Latitude" />
                            <RowContent
                                content={`${
                                    caseData.location.geometry?.latitude?.toFixed(
                                        4,
                                    ) || ''
                                }`}
                            />
                            <RowHeader title="Longitude" />
                            <RowContent
                                content={`${
                                    caseData.location.geometry?.longitude?.toFixed(
                                        4,
                                    ) || ''
                                }`}
                            />

                            <RowHeader title="Comment" />
                            <RowContent content={caseData.location.comment} />
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* EVENT HISTORY */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="event-history"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Event history
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Confirmed case date" />
                            <RowContent
                                content={renderDate(
                                    caseData.events.dateConfirmation,
                                )}
                            />

                            <RowHeader title="Confirmation method" />
                            <RowContent
                                content={caseData.events.confirmationMethod}
                            />

                            <RowHeader title="Symptom onset date" />
                            <RowContent
                                content={renderDate(caseData.events.dateOnset)}
                            />

                            <RowHeader title="First clinical consultation" />
                            <RowContent
                                content={renderDate(
                                    caseData.events.dateOfFirstConsult,
                                )}
                            />

                            <RowHeader title="Home monitoring" />
                            <RowContent
                                content={caseData.events.homeMonitoring}
                            />

                            <RowHeader title="Isolation" />
                            <RowContent content={caseData.events.isolated} />

                            {caseData.events.isolated === YesNo.Y && (
                                <>
                                    <RowHeader title="Date of isolation" />
                                    <RowContent
                                        content={renderDate(
                                            caseData.events.dateIsolation,
                                        )}
                                    />
                                </>
                            )}

                            <RowHeader title="Hospital admission" />
                            <RowContent
                                content={caseData.events.hospitalized}
                            />

                            {caseData.events.hospitalized === YesNo.Y && (
                                <>
                                    <RowHeader title="Hospital admission date" />
                                    <RowContent
                                        content={renderDate(
                                            caseData.events.dateHospitalization,
                                        )}
                                    />
                                    <RowHeader title="Hospital discharge date" />
                                    <RowContent
                                        content={renderDate(
                                            caseData.events
                                                .dateDischargeHospital,
                                        )}
                                    />
                                </>
                            )}

                            <RowHeader title="Intensive care" />
                            <RowContent
                                content={caseData.events.intensiveCare}
                            />

                            {caseData.events.intensiveCare === YesNo.Y && (
                                <>
                                    <RowHeader title="Intensive care admission date" />
                                    <RowContent
                                        content={renderDate(
                                            caseData.events.dateAdmissionICU,
                                        )}
                                    />

                                    <RowHeader title="Intensive care discharge date" />
                                    <RowContent
                                        content={renderDate(
                                            caseData.events.dateDischargeICU,
                                        )}
                                    />
                                </>
                            )}

                            <RowHeader title="Outcome" />
                            <RowContent content={caseData.events.outcome} />

                            {caseData.events.outcome && (
                                <>
                                    <RowHeader
                                        title={`Date of ${
                                            caseData.events.outcome ===
                                            Outcome.Death
                                                ? 'death'
                                                : 'recovery'
                                        }`}
                                    />
                                    <RowContent
                                        content={renderDate(
                                            caseData.events.outcome ===
                                                Outcome.Death
                                                ? caseData.events.dateDeath
                                                : caseData.events.dateRecovered,
                                        )}
                                    />
                                </>
                            )}
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* DEMOGRAPHICS */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="demographics"
                        className={classes.casebox}
                    />
                    <Typography
                        className={classes.sectionTitle}
                        variant="overline"
                    >
                        Demographics
                    </Typography>
                    <Grid container className={classes.grid}>
                        <RowHeader title="Age" />
                        <RowContent
                            content={parseAgeRange(
                                caseData.demographics.ageRange,
                            )}
                        />

                        <RowHeader title="Gender" />
                        <RowContent content={caseData.demographics.gender} />

                        <RowHeader title="Occupation" />
                        <RowContent
                            content={caseData.demographics.occupation}
                        />

                        <RowHeader title="Healthcare worker" />
                        <RowContent
                            content={caseData.demographics.healthcareWorker}
                        />
                    </Grid>
                </Paper>

                {/* SYMPTOMS */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element name="symptoms" className={classes.casebox}>
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Symptoms
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Symptoms" />
                            <RowContent
                                content={
                                    typeof caseData.symptoms === 'string'
                                        ? caseData.symptoms
                                        : ''
                                }
                            />
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* PREEXISTING CONDITIONS */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Typography
                        className={classes.sectionTitle}
                        variant="overline"
                    >
                        Preexisting conditions
                    </Typography>
                    <Grid container className={classes.grid}>
                        <RowHeader title="Preexisting conditions" />
                        <RowContent
                            content={
                                caseData.preexistingConditions
                                    .preexistingCondition
                            }
                        />

                        <RowHeader title="Previous infection" />
                        <RowContent
                            content={
                                caseData.preexistingConditions.previousInfection
                            }
                        />

                        <RowHeader title="Coinfection" />
                        <RowContent
                            content={caseData.preexistingConditions.coInfection}
                        />

                        <RowHeader title="Pregnancy" />
                        <RowContent
                            content={
                                caseData.preexistingConditions.pregnancyStatus
                            }
                        />
                    </Grid>
                </Paper>

                {/* TRANSMISSION */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="transmission"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Transmission
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Transmission" />
                            <RowContent
                                content={caseData.transmission.transmission}
                            />

                            <RowHeader title="Contact with case" />
                            <RowContent
                                content={caseData.transmission.contactWithCase}
                            />

                            <RowHeader title="Contact ID" />
                            <RowContent
                                content={caseData.transmission.contactId?.toString()}
                            />

                            <RowHeader title="Contact setting" />
                            <RowContent
                                content={caseData.transmission.contactSetting}
                            />

                            <RowHeader title="Contact animal" />
                            <RowContent
                                content={caseData.transmission.contactAnimal}
                            />

                            <RowHeader title="Comment" />
                            <RowContent
                                content={caseData.transmission.contactComment}
                            />
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* TRAVEL HISTORY */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="travel-history"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Travel history
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Has travel history" />
                            <RowContent
                                content={caseData.travelHistory.travelHistory}
                            />

                            <RowHeader title="Travel history entry" />
                            <RowContent
                                content={renderDate(
                                    caseData.travelHistory.travelHistoryEntry,
                                )}
                            />

                            <RowHeader title="Has travel start" />
                            <RowContent
                                content={
                                    caseData.travelHistory.travelHistoryStart
                                }
                            />

                            <RowHeader title="Last known location" />
                            <RowContent
                                content={
                                    caseData.travelHistory.travelHistoryLocation
                                }
                            />

                            <RowHeader title="Last known country" />
                            <RowContent
                                content={
                                    caseData.travelHistory.travelHistoryCountry
                                }
                            />
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* PATHOGENS */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="pathogens"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Pathogens & genome sequencing
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Pathogens" />
                            <RowContent content={caseData.pathogen} />

                            <RowHeader title="Genomics metadata" />
                            <RowContent
                                content={
                                    caseData.genomeSequences.genomicsMetadata
                                }
                            />

                            <RowHeader title="Accession number" />
                            <RowContent
                                content={
                                    caseData.genomeSequences.accessionNumber
                                }
                            />
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* VACCINES */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element name="vaccines" className={classes.casebox}>
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Vaccines
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Vaccination" />
                            <RowContent
                                content={caseData.vaccination.vaccination}
                            />

                            <RowHeader title="Vaccine name" />
                            <RowContent
                                content={caseData.vaccination.vaccineName}
                            />

                            <RowHeader title="Date of first vaccination" />
                            <RowContent
                                content={renderDate(
                                    caseData.vaccination.vaccineDate,
                                )}
                            />

                            <RowHeader title="Side effects" />
                            <RowContent
                                content={
                                    typeof caseData.vaccination
                                        .vaccineSideEffects === 'string'
                                        ? caseData.vaccination
                                              .vaccineSideEffects
                                        : ''
                                }
                            />
                        </Grid>
                    </Scroll.Element>
                </Paper>
            </div>
        </>
    );
}

function RowHeader(props: { title: string }): JSX.Element {
    return (
        <Grid item xs={4}>
            <Typography variant="body2">{props.title}</Typography>
        </Grid>
    );
}

function RowContent(props: {
    content?: string;
    isLink?: boolean;
    isMultiline?: boolean;
    linkComment?: string;
}): JSX.Element {
    const searchQuery = useSelector(selectSearchQuery);
    const searchQueryArray: string[] = [];

    function words(s: string) {
        const q = new URLSearchParams(s).get('q');
        if (!q) return;

        const quoted: string[] = [];
        const notQuoted: string[] = [];
        if (q.includes('"') && q.replace(/[^"]/g, '').length % 2 !== 1) {
            q.split('"').map((subs: string, i: number) => {
                subs != '' && i % 2 ? quoted.push(subs) : notQuoted.push(subs);
            });
        } else notQuoted.push(q);

        const regex = /"([^"]+)"|(\S{1,})/g;
        // Make sure that terms in quotes will be highlighted as one search term
        for (const quotedEntry of quoted) {
            let match;
            let accumulator: string[] = [];
            while ((match = regex.exec(quotedEntry))) {
                accumulator.push(match[match[1] ? 1 : 2]);
            }
            searchQueryArray.push(accumulator.join(' '));
        }
        for (const notQuotedEntry of notQuoted) {
            let match;
            while ((match = regex.exec(notQuotedEntry))) {
                searchQueryArray.push(match[match[1] ? 1 : 2]);
            }
        }
    }
    words(searchQuery);

    return (
        <Grid item xs={8} style={{ fontSize: 14 }}>
            {props.isLink && props.content ? (
                <a
                    href={createHref(props.content)}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <Highlighter
                        highlightStyle={{ fontWeight: 'bold' }}
                        className="highlighted"
                        searchWords={searchQueryArray}
                        autoEscape={true}
                        textToHighlight={props.content ?? ''}
                    />
                    {props.linkComment && ` (${props.linkComment})`}
                </a>
            ) : (
                <Highlighter
                    style={{ whiteSpace: 'pre-wrap' }}
                    highlightStyle={{ fontWeight: 'bold' }}
                    className="highlighted"
                    searchWords={searchQueryArray}
                    autoEscape={true}
                    textToHighlight={props.content ?? ''}
                />
            )}
        </Grid>
    );
}
