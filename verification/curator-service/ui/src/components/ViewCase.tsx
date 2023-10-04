import React, { useEffect, useState } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Typography,
} from '@mui/material';
import { Day0Case, Outcome, YesNo } from '../api/models/Day0Case';
import AppModal from './AppModal';
import EditIcon from '@mui/icons-material/EditOutlined';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import { Link } from 'react-router-dom';
import MuiAlert from '@mui/material/Alert';
import Scroll from 'react-scroll';
import axios from 'axios';
import createHref from './util/links';
import makeStyles from '@mui/styles/makeStyles';
import renderDate from './util/date';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Highlighter from 'react-highlight-words';
import { useSelector } from 'react-redux';
import { selectFilterBreadcrumbs } from '../redux/app/selectors';
import { selectSearchQuery } from '../redux/linelistTable/selectors';
import Chip from '@mui/material/Chip';
import { nameCountry } from './util/countryNames';
import { parseAgeRange } from './util/helperFunctions';
import CloseIcon from '@mui/icons-material/Close';
import { selectUser } from '../redux/auth/selectors';
import { Role } from '../api/models/User';

const styles = makeStyles(() => ({
    errorMessage: {
        height: 'fit-content',
        width: '100%',
    },
}));

interface Props {
    id: string;
    enableEdit?: boolean;
    onModalClose: () => void;
}

export default function ViewCase(props: Props): JSX.Element {
    const [c, setCase] = useState<Day0Case>();
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>();

    useEffect(() => {
        setLoading(true);
        axios
            .get<Day0Case[]>(`/api/cases/${props.id}`)
            .then((resp) => {
                setCase(resp.data[0]);
                setErrorMessage(undefined);
            })
            .catch((e) => {
                setCase(undefined);
                setErrorMessage(e.response?.data?.message || e.toString());
            })
            .finally(() => setLoading(false));
    }, [props.id]);

    const verifyCase = (
        onSuccess: () => void,
        onError: (errorMessage: string) => void,
        caseId: string,
        verifierEmail: string,
    ) => {
        if (caseId && verifierEmail) {
            setLoading(true);
            axios
                .post(`/api/cases/verify/${caseId}`, {
                    email: verifierEmail,
                })
                .then((resp) => {
                    setCase(resp.data[0]);
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

    const classes = styles();

    return (
        <AppModal title="Case details" onModalClose={props.onModalClose}>
            {loading && <LinearProgress />}
            {errorMessage && (
                <MuiAlert
                    className={classes.errorMessage}
                    elevation={6}
                    variant="filled"
                    severity="error"
                >
                    {errorMessage}
                </MuiAlert>
            )}
            {c && (
                <CaseDetails
                    enableEdit={props.enableEdit}
                    c={c}
                    verifyCase={verifyCase}
                />
            )}
        </AppModal>
    );
}
interface CaseDetailsProps {
    c: Day0Case;
    verifyCase: (
        onSuccess: () => void,
        onError: (errorMessage: string) => void,
        caseId: string,
        userEmail: string,
    ) => void;
    enableEdit?: boolean;
}

const useStyles = makeStyles((theme) => ({
    paper: {
        background: theme.palette.background.paper,
        marginTop: '1em',
    },
    caseTitle: {
        marginTop: '1em',
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
    editBtn: {
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
    const showNavMenu = useMediaQuery(theme.breakpoints.up('sm'));
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const classes = useStyles();

    const scrollTo = (name: string): void => {
        Scroll.scroller.scrollTo(name, {
            duration: 100,
            smooth: true,
            containerId: 'scroll-container',
        });
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
                    Case {props.c._id}{' '}
                    {props.enableEdit && (
                        <Link
                            to={`/cases/edit/${props.c._id}`}
                            style={{ textDecoration: 'none' }}
                        >
                            <Button
                                data-testid="edit-button"
                                variant="outlined"
                                color="primary"
                                className={classes.editBtn}
                                endIcon={<EditIcon />}
                            >
                                Edit
                            </Button>
                        </Link>
                    )}
                    {props.c._id &&
                        !props.c.curators?.verifiedBy &&
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
                                    <Button
                                        data-testid="verify-dialog-confirm-button"
                                        variant="contained"
                                        color="primary"
                                        className={classes.verifyDialogBtn}
                                        endIcon={<CheckIcon />}
                                        onClick={() =>
                                            props.verifyCase(
                                                () =>
                                                    setVerifyDialogOpen(false),
                                                (errorMessage: string) => {
                                                    console.log(errorMessage);
                                                },
                                                props.c._id || '',
                                                user.email || '',
                                            )
                                        }
                                    >
                                        Verify
                                    </Button>
                                </Dialog>
                                <Button
                                    data-testid="verify-button"
                                    variant="outlined"
                                    color="primary"
                                    className={classes.verifyBtn}
                                    endIcon={<CheckIcon />}
                                    onClick={() => setVerifyDialogOpen(true)}
                                >
                                    Verify
                                </Button>
                            </>
                        )}
                </Typography>
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
                            content={props.c.curators?.createdBy.email}
                        />

                        <RowHeader title="Verified by" />
                        <RowContent
                            content={
                                props.c.curators?.verifiedBy
                                    ? props.c.curators?.verifiedBy.name
                                        ? props.c.curators?.verifiedBy.name
                                        : props.c.curators?.verifiedBy.email
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
                            <RowContent content={props.c.caseStatus} />

                            <RowHeader title="Data source URL" />
                            <RowContent
                                content={props.c.caseReference?.sourceUrl || ''}
                                isLink
                            />
                            <RowHeader title="Government Source" />
                            <RowContent
                                content={
                                    props.c.caseReference?.isGovernmentSource
                                        ? 'YES'
                                        : 'NO'
                                }
                            />
                            {props.c.caseReference.additionalSources &&
                                props.c.caseReference.additionalSources.length >
                                    0 &&
                                props.c.caseReference.additionalSources.map(
                                    (source, idx) => (
                                        <>
                                            <RowHeader
                                                title={`Source ${idx + 2}`}
                                            />
                                            <RowContent
                                                content={source.sourceUrl || ''}
                                                isLink
                                            />
                                        </>
                                    ),
                                )}

                            <RowHeader title="Data upload IDs" />
                            <RowContent
                                content={
                                    props.c.caseReference?.uploadIds?.join(
                                        ', ',
                                    ) || ''
                                }
                            />

                            <RowHeader title="Date of creation" />
                            <RowContent
                                content={renderDate(props.c.events.dateEntry)}
                            />

                            <RowHeader title="Reported date" />
                            <RowContent
                                content={renderDate(
                                    props.c.events.dateReported,
                                )}
                            />

                            <RowHeader title="Date of edit" />
                            <RowContent
                                content={renderDate(
                                    props.c.events.dateLastModified,
                                )}
                            />
                            <RowHeader title="Curator's comment" />
                            <RowContent content={props.c.comment} isMultiline />
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
                                content={`${props.c.location.geoResolution}`}
                            />
                            <RowHeader title="Country" />
                            <RowContent
                                content={
                                    props.c.location.countryISO3
                                        ? nameCountry(
                                              props.c.location.countryISO3,
                                              props.c.location.country,
                                          )
                                        : ''
                                }
                            />

                            <RowHeader title="Region" />
                            <RowContent content={props.c.location.region} />

                            <RowHeader title="District" />
                            <RowContent content={props.c.location.district} />

                            <RowHeader title="Place" />
                            <RowContent content={props.c.location.place} />

                            <RowHeader title="Location" />
                            <RowContent content={props.c.location.location} />

                            <RowHeader title="Latitude" />
                            <RowContent
                                content={`${props.c.location.geometry?.latitude?.toFixed(
                                    4,
                                )}`}
                            />
                            <RowHeader title="Longitude" />
                            <RowContent
                                content={`${props.c.location.geometry?.longitude?.toFixed(
                                    4,
                                )}`}
                            />
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
                                    props.c.events.dateConfirmation,
                                )}
                            />

                            <RowHeader title="Confirmation method" />
                            <RowContent
                                content={props.c.events.confirmationMethod}
                            />

                            <RowHeader title="Symptom onset date" />
                            <RowContent
                                content={renderDate(props.c.events.dateOnset)}
                            />

                            <RowHeader title="First clinical consultation" />
                            <RowContent
                                content={renderDate(
                                    props.c.events.dateOfFirstConsult,
                                )}
                            />

                            <RowHeader title="Home monitoring" />
                            <RowContent
                                content={props.c.events.homeMonitoring}
                            />

                            <RowHeader title="Isolation" />
                            <RowContent content={props.c.events.isolated} />

                            {props.c.events.isolated === YesNo.Y && (
                                <>
                                    <RowHeader title="Date of isolation" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.events.dateIsolation,
                                        )}
                                    />
                                </>
                            )}

                            <RowHeader title="Hospital admission" />
                            <RowContent content={props.c.events.hospitalized} />

                            {props.c.events.hospitalized === YesNo.Y && (
                                <>
                                    <RowHeader title="Hospital admission date" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.events.dateHospitalization,
                                        )}
                                    />
                                    <RowHeader title="Hospital discharge date" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.events
                                                .dateDischargeHospital,
                                        )}
                                    />
                                </>
                            )}

                            <RowHeader title="Intensive care" />
                            <RowContent
                                content={props.c.events.intensiveCare}
                            />

                            {props.c.events.intensiveCare === YesNo.Y && (
                                <>
                                    <RowHeader title="Intensive care admission date" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.events.dateAdmissionICU,
                                        )}
                                    />

                                    <RowHeader title="Intensive care discharge date" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.events.dateDischargeICU,
                                        )}
                                    />
                                </>
                            )}

                            <RowHeader title="Outcome" />
                            <RowContent content={props.c.events.outcome} />

                            {props.c.events.outcome && (
                                <>
                                    <RowHeader
                                        title={`Date of ${
                                            props.c.events.outcome ===
                                            Outcome.Death
                                                ? 'death'
                                                : 'recovery'
                                        }`}
                                    />
                                    <RowContent
                                        content={renderDate(
                                            props.c.events.outcome ===
                                                Outcome.Death
                                                ? props.c.events.dateDeath
                                                : props.c.events.dateRecovered,
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
                                props.c.demographics.ageRange,
                            )}
                        />

                        <RowHeader title="Gender" />
                        <RowContent content={props.c.demographics.gender} />

                        <RowHeader title="Occupation" />
                        <RowContent content={props.c.demographics.occupation} />

                        <RowHeader title="Healthcare worker" />
                        <RowContent
                            content={props.c.demographics.healthcareWorker}
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
                                    typeof props.c.symptoms === 'string'
                                        ? props.c.symptoms
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
                                props.c.preexistingConditions
                                    .preexistingCondition
                            }
                        />

                        <RowHeader title="Previous infection" />
                        <RowContent
                            content={
                                props.c.preexistingConditions.previousInfection
                            }
                        />

                        <RowHeader title="Coinfection" />
                        <RowContent
                            content={props.c.preexistingConditions.coInfection}
                        />

                        <RowHeader title="Pregnancy" />
                        <RowContent
                            content={
                                props.c.preexistingConditions.pregnancyStatus
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
                                content={props.c.transmission.transmission}
                            />

                            <RowHeader title="Contact with case" />
                            <RowContent
                                content={props.c.transmission.contactWithCase}
                            />

                            <RowHeader title="Contact ID" />
                            <RowContent
                                content={props.c.transmission.contactId?.toString()}
                            />

                            <RowHeader title="Contact setting" />
                            <RowContent
                                content={props.c.transmission.contactSetting}
                            />

                            <RowHeader title="Contact animal" />
                            <RowContent
                                content={props.c.transmission.contactAnimal}
                            />

                            <RowHeader title="Comment" />
                            <RowContent
                                content={props.c.transmission.contactComment}
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
                                content={props.c.travelHistory.travelHistory}
                            />

                            <RowHeader title="Travel history entry" />
                            <RowContent
                                content={renderDate(
                                    props.c.travelHistory.travelHistoryEntry,
                                )}
                            />

                            <RowHeader title="Has travel start" />
                            <RowContent
                                content={
                                    props.c.travelHistory.travelHistoryStart
                                }
                            />

                            <RowHeader title="Last known location" />
                            <RowContent
                                content={
                                    props.c.travelHistory.travelHistoryLocation
                                }
                            />

                            <RowHeader title="Last known country" />
                            <RowContent
                                content={
                                    props.c.travelHistory.travelHistoryCountry
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
                            <RowContent content={props.c.pathogen} />

                            <RowHeader title="Genomics metadata" />
                            <RowContent
                                content={
                                    props.c.genomeSequences.genomicsMetadata
                                }
                            />

                            <RowHeader title="Accession number" />
                            <RowContent
                                content={
                                    props.c.genomeSequences.accessionNumber
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
                                content={props.c.vaccination.vaccination}
                            />

                            <RowHeader title="Vaccine name" />
                            <RowContent
                                content={props.c.vaccination.vaccineName}
                            />

                            <RowHeader title="Date of first vaccination" />
                            <RowContent
                                content={renderDate(
                                    props.c.vaccination.vaccineDate,
                                )}
                            />

                            <RowHeader title="Side effects" />
                            <RowContent
                                content={
                                    typeof props.c.vaccination
                                        .vaccineSideEffects === 'string'
                                        ? props.c.vaccination.vaccineSideEffects
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
}): JSX.Element {
    const searchQuery = useSelector(selectSearchQuery);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchQueryArray: any[] = [];

    function words(s: string) {
        const regex = /"([^"]+)"|(\w{3,})/g;
        let match;
        while ((match = regex.exec(s))) {
            searchQueryArray.push(match[match[1] ? 1 : 2]);
        }
        return searchQueryArray;
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
