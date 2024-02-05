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
import {
    ContactSetting,
    Day0Case,
    Ethnicity,
    Gender,
    Outcome,
    Race,
    SexAtBirth,
    YesNo,
} from '../api/models/Day0Case';
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
                        onClick={(): void => scrollTo('case-demographics')}
                    >
                        case demographics
                    </Button>
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('location')}
                    >
                        location
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('medical-history')}
                    >
                        medical history
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('clinical-presentation')}
                    >
                        clinical presentation
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('exposure')}
                    >
                        exposure
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('laboratory-information')}
                    >
                        laboratory information
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('source-information')}
                    >
                        source information
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
                {/* CASE DEMOGRAPHICS */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="case-demographics"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Case demographics
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Case status" />
                            <RowContent content={props.c.caseStatus} />

                            <RowHeader title="Pathogen status" />
                            <RowContent
                                content={props.c.pathogenStatus || undefined}
                            />

                            <RowHeader title="Age" />
                            <RowContent content={props.c.age} />

                            <RowHeader title="Sex at birth" />
                            <RowContent content={props.c.sexAtBirth} />

                            {props.c.sexAtBirth === SexAtBirth.Other && (
                                <>
                                    <RowHeader title="Sex at birth other" />
                                    <RowContent
                                        content={props.c.sexAtBirthOther}
                                    />
                                </>
                            )}

                            <RowHeader title="Gender" />
                            <RowContent content={props.c.gender} />

                            {props.c.gender === Gender.Other && (
                                <>
                                    <RowHeader title="Gender other" />
                                    <RowContent content={props.c.genderOther} />
                                </>
                            )}

                            <RowHeader title="Race" />
                            <RowContent content={props.c.race} />

                            {props.c.race === Race.Other && (
                                <>
                                    <RowHeader title="Race other" />
                                    <RowContent content={props.c.raceOther} />
                                </>
                            )}

                            <RowHeader title="Ethnicity" />
                            <RowContent content={props.c.ethnicity} />

                            {props.c.ethnicity === Ethnicity.Other && (
                                <>
                                    <RowHeader title="Ethnicity other" />
                                    <RowContent
                                        content={props.c.ethnicityOther}
                                    />
                                </>
                            )}

                            <RowHeader title="Nationality" />
                            <RowContent content={props.c.nationality} />

                            {props.c.nationality === 'Other' && (
                                <>
                                    <RowHeader title="Nationality other" />
                                    <RowContent
                                        content={props.c.nationalityOther}
                                    />
                                </>
                            )}

                            <RowHeader title="Occupation" />
                            <RowContent content={props.c.occupation} />

                            <RowHeader title="Healthcare Worker" />
                            <RowContent content={props.c.healthcareWorker} />

                            {/*<RowContent content={props.c.comment} isMultiline />*/}
                        </Grid>
                    </Scroll.Element>
                </Paper>
                {/* CASE DATA */}
                {/*<Paper className={classes.paper} variant="outlined" square>*/}
                {/*    <Scroll.Element*/}
                {/*        name="case-data"*/}
                {/*        className={classes.casebox}*/}
                {/*    >*/}
                {/*        <Typography*/}
                {/*            className={classes.sectionTitle}*/}
                {/*            variant="overline"*/}
                {/*        >*/}
                {/*            Case data*/}
                {/*        </Typography>*/}
                {/*        <Grid container className={classes.grid}>*/}
                {/*            <RowHeader title="Case status" />*/}
                {/*            <RowContent content={props.c.caseStatus} />*/}

                {/*            <RowHeader title="Data source URL" />*/}
                {/*            <RowContent*/}
                {/*                content={props.c.caseReference?.sourceUrl || ''}*/}
                {/*                isLink*/}
                {/*            />*/}
                {/*            <RowHeader title="Government Source" />*/}
                {/*            <RowContent*/}
                {/*                content={*/}
                {/*                    props.c.caseReference?.isGovernmentSource*/}
                {/*                        ? 'YES'*/}
                {/*                        : 'NO'*/}
                {/*                }*/}
                {/*            />*/}
                {/*            {props.c.caseReference.additionalSources &&*/}
                {/*                props.c.caseReference.additionalSources.length >*/}
                {/*                    0 &&*/}
                {/*                props.c.caseReference.additionalSources.map(*/}
                {/*                    (source, idx) => (*/}
                {/*                        <>*/}
                {/*                            <RowHeader*/}
                {/*                                title={`Source ${idx + 2}`}*/}
                {/*                            />*/}
                {/*                            <RowContent*/}
                {/*                                content={source.sourceUrl || ''}*/}
                {/*                                isLink*/}
                {/*                            />*/}
                {/*                        </>*/}
                {/*                    ),*/}
                {/*                )}*/}

                {/*            <RowHeader title="Data upload IDs" />*/}
                {/*            <RowContent*/}
                {/*                content={*/}
                {/*                    props.c.caseReference?.uploadIds?.join(*/}
                {/*                        ', ',*/}
                {/*                    ) || ''*/}
                {/*                }*/}
                {/*            />*/}

                {/*            <RowHeader title="Date of creation" />*/}
                {/*            <RowContent*/}
                {/*                content={renderDate(props.c.events.dateEntry)}*/}
                {/*            />*/}

                {/*            <RowHeader title="Reported date" />*/}
                {/*            <RowContent*/}
                {/*                content={renderDate(*/}
                {/*                    props.c.events.dateReported,*/}
                {/*                )}*/}
                {/*            />*/}

                {/*            <RowHeader title="Date of edit" />*/}
                {/*            <RowContent*/}
                {/*                content={renderDate(*/}
                {/*                    props.c.events.dateLastModified,*/}
                {/*                )}*/}
                {/*            />*/}
                {/*            <RowHeader title="Curator's comment" />*/}
                {/*            <RowContent content={props.c.comment} isMultiline />*/}
                {/*        </Grid>*/}
                {/*    </Scroll.Element>*/}
                {/*</Paper>*/}

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

                            <RowHeader title="Comment" />
                            <RowContent content={props.c.location.comment} />
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* MEDICAL HISTORY */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="medical-history"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Medical history
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Previous infection" />
                            <RowContent content={props.c.previousInfection} />

                            <RowHeader title="Co-Infection" />
                            <RowContent
                                content={(props.c.coInfection || []).join(', ')}
                            />

                            <RowHeader title="Pre-Existing Conditions" />
                            <RowContent
                                content={(
                                    props.c.preexistingCondition || []
                                ).join(', ')}
                            />

                            <RowHeader title="Pregnacy Status" />
                            <RowContent content={props.c.pregnancyStatus} />

                            <RowHeader title="Vaccination" />
                            <RowContent content={props.c.vaccination} />

                            {props.c.vaccination === YesNo.Y && (
                                <>
                                    <RowHeader title="Vaccine Name" />
                                    <RowContent content={props.c.vaccineName} />

                                    <RowHeader title="Vaccine Date" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.vaccineDate,
                                        )}
                                    />

                                    <RowHeader title="Vaccine Side Effects" />
                                    <RowContent
                                        content={(
                                            props.c.vaccineSideEffects || []
                                        ).join(', ')}
                                    />
                                </>
                            )}
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* CLINICAL PRESENTATION */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="clinical-presentation"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Clinical Presentation
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Symptoms" />
                            <RowContent
                                content={(props.c.symptoms || []).join(', ')}
                            />

                            <RowHeader title="Date Report" />
                            <RowContent
                                content={renderDate(props.c.dateReport)}
                            />

                            <RowHeader title="Date Onset" />
                            <RowContent
                                content={renderDate(props.c.dateOnset)}
                            />

                            <RowHeader title="Date Confirmation" />
                            <RowContent
                                content={renderDate(props.c.dateConfirmation)}
                            />

                            <RowHeader title="Confirmation Method" />
                            <RowContent content={props.c.confirmationMethod} />

                            <RowHeader title="Date of First Consultation" />
                            <RowContent
                                content={renderDate(
                                    props.c.dateOfFirstConsultation,
                                )}
                            />

                            <RowHeader title="Hospitalised" />
                            <RowContent content={props.c.hospitalised} />

                            {props.c.hospitalised === YesNo.Y && (
                                <>
                                    <RowHeader title="Reason for Hospitalisation" />
                                    <RowContent
                                        content={(
                                            props.c.reasonForHospitalisation ||
                                            []
                                        ).join(', ')}
                                    />

                                    <RowHeader title="Date Hospitalisatoin" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.dateHospitalisation,
                                        )}
                                    />

                                    <RowHeader title="Date Discharged Hospital" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.dateDischargeHospital,
                                        )}
                                    />
                                </>
                            )}

                            <RowHeader title="Intensive Care" />
                            <RowContent content={props.c.intensiveCare} />

                            {props.c.intensiveCare === YesNo.Y && (
                                <>
                                    <RowHeader title="Date Admission ICU" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.dateAdmissionICU,
                                        )}
                                    />

                                    <RowHeader title="Date Discharged ICU" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.dateDischargeICU,
                                        )}
                                    />
                                </>
                            )}

                            <RowHeader title="Home Monitoring" />
                            <RowContent content={props.c.homeMonitoring} />

                            <RowHeader title="Isolated" />
                            <RowContent content={props.c.isolated} />

                            {props.c.isolated === YesNo.Y && (
                                <>
                                    <RowHeader title="Date Isolation" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.dateIsolation,
                                        )}
                                    />
                                </>
                            )}

                            <RowHeader title="Outcome" />
                            <RowContent content={props.c.outcome} />

                            {props.c.outcome === Outcome.Death && (
                                <>
                                    <RowHeader title="Date Death" />
                                    <RowContent
                                        content={renderDate(props.c.dateDeath)}
                                    />
                                </>
                            )}

                            {props.c.outcome === Outcome.Recovered && (
                                <>
                                    <RowHeader title="Date Recovery" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.dateRecovery,
                                        )}
                                    />
                                </>
                            )}
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* EXPOSURE */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element name="exposure" className={classes.casebox}>
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Exposure
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Contact with Case" />
                            <RowContent content={props.c.contactWithCase} />

                            {props.c.contactWithCase === YesNo.Y && (
                                <>
                                    <RowHeader title="Contact ID" />
                                    <RowContent content={props.c.contactID} />

                                    <RowHeader title="Contact Setting" />
                                    <RowContent
                                        content={props.c.contactSetting}
                                    />

                                    {props.c.contactSetting ===
                                        ContactSetting.Other && (
                                        <>
                                            <RowHeader title="Contact Setting Other" />
                                            <RowContent
                                                content={
                                                    props.c.contactSettingOther
                                                }
                                            />
                                        </>
                                    )}

                                    <RowHeader title="Contact Animal" />
                                    <RowContent
                                        content={props.c.contactAnimal}
                                    />

                                    <RowHeader title="Contact Comment" />
                                    <RowContent
                                        content={props.c.contactComment}
                                    />
                                </>
                            )}

                            <RowHeader title="Transmission" />
                            <RowContent content={props.c.transmission} />

                            <RowHeader title="Travel History" />
                            <RowContent content={props.c.travelHistory} />

                            {props.c.travelHistory === YesNo.Y && (
                                <>
                                    <RowHeader title="Travel History Entry" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.travelHistoryEntry,
                                        )}
                                    />
                                    <RowHeader title="Travel History Start" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.travelHistoryStart,
                                        )}
                                    />
                                    {/*    TODO location*/}
                                </>
                            )}
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* LABORATORY INFORMATION */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="laboratory-information"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Laboratory Information
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Genomics Metadata" />
                            <RowContent content={props.c.genomicsMetadata} />

                            <RowHeader title="Accession Number" />
                            <RowContent content={props.c.accessionNumber} />
                        </Grid>
                    </Scroll.Element>
                </Paper>

                {/* SOURCE INFORMATION */}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="source-information"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Source Information
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Source" />
                            <RowContent content={props.c.source} />

                            {props.c.source !== '' && (
                                <>
                                    <RowHeader title="Source II" />
                                    <RowContent content={props.c.sourceII} />
                                    {props.c.sourceII !== '' && (
                                        <>
                                            <RowHeader title="Source III" />
                                            <RowContent
                                                content={props.c.sourceIII}
                                            />
                                            {props.c.sourceIII !== '' && (
                                                <>
                                                    <RowHeader title="Source IV" />
                                                    <RowContent
                                                        content={
                                                            props.c.sourceIV
                                                        }
                                                    />
                                                </>
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                            <RowHeader title="Date Entry" />
                            <RowContent
                                content={renderDate(props.c.dateEntry)}
                            />

                            <RowHeader title="Date Last Modified" />
                            <RowContent
                                content={renderDate(props.c.dateLastModified)}
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
