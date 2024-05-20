import axios from 'axios';
import React from 'react';
import Scroll from 'react-scroll';
import { throttle } from 'lodash';
import {
    FastField,
    Field,
    useFormikContext,
    FieldArray,
    ErrorMessage,
} from 'formik';
import { CheckboxWithLabel, TextField } from 'formik-mui';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Autocomplete, Button, List, ListItem, Grid } from '@mui/material';
import { createFilterOptions } from '@mui/material/useAutocomplete';
import { makeStyles } from 'tss-react/mui';

import { Day0CaseFormValues, CaseReference } from '../../api/models/Day0Case';
import BulkCaseFormValues from '../bulk-case-form-fields/BulkCaseFormValues';
import FieldTitle from './FieldTitle';
import { StyledTooltip } from '../new-case-form-fields/StyledTooltip';

interface SourceProps {
    initialValue?: CaseReference;
    hasSourceEntryId?: boolean;
    freeSolo?: boolean;
    sourcesWithStableIdentifiers?: boolean;
    withAdditioanlSources?: boolean;
}

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>New data source:</strong> If this is a new data source
                you will need to add it to the system along with the data source
                name, license, and information about the provider. For example
                if the raw source was the “7th July Press Release from Honduras”
                the provider name would be the issuer of the press release e.g.
                “Honduras ministry of health”. The provider name needs to
                reflect the actual provider of the data, not the method of
                reporting. The source name can be anything informative to
                curators. The source URL should be a link to the data you`re
                uploading, while the provider website URL should link to an
                informative website.
            </li>
            <li>
                <strong>Existing data source:</strong> If the URL is an existing
                source already in the system, select the appropriate source from
                the list provided.
            </li>
        </ul>
    </StyledTooltip>
);

const useSourceStyles = makeStyles()(() => ({
    additionalSources: {
        width: '50%',
    },
    sourceEntryId: {
        marginTop: '1em',
        width: '50%',
    },
    hidden: {
        display: 'none',
    },
    halfField: {
        width: '50%',
    },
    fullwidthField: {
        width: '100%',
    },
}));

export default function Source(props: SourceProps) {
    const { classes } = useSourceStyles();
    const { values } = useFormikContext<
        Day0CaseFormValues | BulkCaseFormValues
    >();

    const freeSolo = props.freeSolo === undefined ? true : props.freeSolo;

    return (
        <Scroll.Element name="source">
            <FieldTitle title="Data Source" tooltip={<TooltipText />} />
            <SourcesAutocomplete
                initialValue={props.initialValue}
                freeSolo={freeSolo}
                sourcesWithStableIdentifiers={
                    props.sourcesWithStableIdentifiers
                }
            />
            <FastField
                name={`caseReference.isGovernmentSource`}
                component={CheckboxWithLabel}
                type="checkbox"
                // helperText="Whether cases from this source can appear in the line list"
                required
                data-testid="isGovernmentSource"
                Label={{
                    label: 'Government Source',
                }}
            />
            <FieldArray
                name="caseReference.additionalSources"
                render={(arrayHelpers) => (
                    <List className={classes.halfField}>
                        {values.caseReference?.additionalSources &&
                            values.caseReference.additionalSources.length > 0 &&
                            values.caseReference.additionalSources.map(
                                (
                                    source: {
                                        isGovernmentSource: boolean;
                                        sourceUrl: string;
                                    },
                                    index: number,
                                ) => (
                                    <ListItem key={index}>
                                        <Grid
                                            container
                                            spacing={0.5}
                                            justifyContent="center"
                                            alignItems="center"
                                        >
                                            <Grid item xs={10}>
                                                <FastField
                                                    variant="outlined"
                                                    className={
                                                        classes.fullwidthField
                                                    }
                                                    label="Additional source"
                                                    name={`caseReference.additionalSources.${index}.sourceUrl`}
                                                    type="text"
                                                    component={TextField}
                                                    sx={{ minWidth: '13rem' }}
                                                />
                                            </Grid>
                                            <Grid item xs={2}>
                                                <Button
                                                    type="button"
                                                    id="delete-additional-location"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() =>
                                                        arrayHelpers.remove(
                                                            index,
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </Grid>
                                            <Grid item xs={12} md={12}>
                                                <FastField
                                                    name={`caseReference.additionalSources.${index}.isGovernmentSource`}
                                                    component={
                                                        CheckboxWithLabel
                                                    }
                                                    type="checkbox"
                                                    // helperText="Whether cases from this source can appear in the line list"
                                                    required
                                                    data-testid="governmentSource"
                                                    Label={{
                                                        label: 'Government Source',
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </ListItem>
                                ),
                            )}
                        <ListItem>
                            <Button
                                type="button"
                                variant="outlined"
                                id="add-additional-source"
                                startIcon={<AddIcon />}
                                onClick={() =>
                                    arrayHelpers.push({
                                        sourceUrl: '',
                                        isGovernmentSource: false,
                                    })
                                }
                            >
                                Add a source
                            </Button>
                        </ListItem>
                    </List>
                )}
            />

            {/*{props.hasSourceEntryId && (*/}
            {/*    <FastField*/}
            {/*        className={classes.sourceEntryId}*/}
            {/*        label="Source entry ID"*/}
            {/*        name="caseReference.sourceEntryId"*/}
            {/*        type="text"*/}
            {/*        data-testid="sourceEntryId"*/}
            {/*        component={TextField}*/}
            {/*        fullWidth*/}
            {/*    />*/}
            {/*)}*/}

            {/*{props.withAdditioanlSources && (*/}
            {/*    <div className={classes.additionalSources}>*/}
            {/*        {renderedAdditionalSources()}*/}
            {/*    </div>*/}
            {/*)}*/}

            {/*{props.withAdditioanlSources && additionalSourceNum < 7 && (*/}
            {/*    <Button*/}
            {/*        variant="outlined"*/}
            {/*        id="add-additional-sources"*/}
            {/*        startIcon={<AddIcon />}*/}
            {/*        onClick={handleadditionalSourceClick}*/}
            {/*        sx={{ marginTop: '1rem' }}*/}
            {/*    >*/}
            {/*        Add additional source*/}
            {/*    </Button>*/}
            {/*)}*/}
        </Scroll.Element>
    );
}

interface OriginData {
    url: string;
    isGovernmentSource: boolean;
    license: string;
    providerName?: string;
    providerWebsiteUrl?: string;
}

interface SourceData {
    _id: string;
    name: string;
    origin: OriginData;
    hasStableIdentifiers?: boolean;
    isGovernmentSource?: boolean;
}

export interface CaseReferenceForm extends CaseReference {
    inputValue?: string;
    sourceName?: string;
    sourceLicense?: string;
    sourceProviderName?: string;
    sourceProviderUrl?: string;
}

interface ListSourcesResponse {
    sources: SourceData[];
}

interface SourceAutocompleteProps {
    initialValue?: CaseReference;
    freeSolo: boolean;
    sourcesWithStableIdentifiers?: boolean;
    index?: number;
}

export async function submitSource(opts: {
    name: string;
    url: string;
    license: string;
    format?: string;
    providerName?: string;
    providerWebsiteUrl?: string;
    isGovernmentSource?: boolean;
}): Promise<CaseReference> {
    const newSource = {
        name: opts.name,
        origin: {
            url: opts.url,
            isGovernmentSource: opts.isGovernmentSource,
            license: opts.license,
            providerName: opts.providerName,
            providerWebsiteUrl: opts.providerWebsiteUrl,
        },
        format: opts.format,
    };
    const resp = await axios.post<SourceData>('/api/sources', newSource);
    return {
        sourceId: resp.data._id,
        sourceUrl: opts.url,
        isGovernmentSource: opts.isGovernmentSource || false,
        additionalSources: [] as unknown as [
            { sourceUrl: string; isGovernmentSource: boolean },
        ],
    };
}

const filter = createFilterOptions<CaseReferenceForm>();

const useStyles = makeStyles()(() => ({
    sourceTextField: {
        marginTop: '1em',
    },
    fieldRow: {
        maxWidth: '50%',
    },
    errorMessage: {
        fontSize: '0.75em',
        color: '#FD685B',
        marginLeft: '14px',
        marginTop: '3px',
    },
}));

export function SourcesAutocomplete(
    props: SourceAutocompleteProps,
): JSX.Element {
    const { classes } = useStyles();
    const name = 'caseReference';
    const [value, setValue] = React.useState<CaseReferenceForm | null>(
        props.initialValue || null,
    );

    const [inputValue, setInputValue] = React.useState('');
    const [options, setOptions] = React.useState<CaseReferenceForm[]>([]);
    const { setFieldValue, values } = useFormikContext<
        Day0CaseFormValues | BulkCaseFormValues
    >();

    const fetch = React.useMemo(
        () =>
            throttle(
                async (
                    request: { url: string },
                    callback: (results?: SourceData[]) => void,
                ) => {
                    const resp = await axios.get<ListSourcesResponse>(
                        '/api/sources',
                        {
                            params: request,
                        },
                    );
                    // this filtering could also be done server-side but there isn't a big number of sources
                    if (props.sourcesWithStableIdentifiers) {
                        callback(
                            resp.data.sources.filter((s) => {
                                return (
                                    s.hasStableIdentifiers === undefined ||
                                    s.hasStableIdentifiers === true
                                );
                            }),
                        );
                    } else {
                        callback(resp.data.sources);
                    }
                },
                250,
            ),
        [props.sourcesWithStableIdentifiers],
    );

    const sourceURLValidation = (str: string) => {
        if (str.length > 0) {
            const pattern = new RegExp(
                '^(https?:\\/\\/)?' + // protocol
                    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                    '(\\#[-a-z\\d_]*)?$',
                'i',
            ); // fragment locator
            return pattern.test(str);
        } else {
            return false;
        }
    };

    React.useEffect(() => {
        let active = true;

        fetch({ url: inputValue }, (results?: SourceData[]) => {
            if (active) {
                let newOptions = [] as CaseReferenceForm[];

                if (results) {
                    newOptions = [
                        ...newOptions,
                        ...results.map(
                            (source) =>
                                ({
                                    sourceId: source._id,
                                    sourceUrl: source.origin.url,
                                    isGovernmentSource:
                                        source.origin.isGovernmentSource ||
                                        false,
                                    sourceName: source.name,
                                    sourceLicense: source.origin.license,
                                    sourceProviderName:
                                        source.origin.providerName,
                                    sourceProviderUrl:
                                        source.origin.providerWebsiteUrl,
                                    additionalSources: [] as unknown as [
                                        {
                                            sourceUrl: string;
                                            isGovernmentSource: boolean;
                                        },
                                    ],
                                } as CaseReferenceForm),
                        ),
                    ];
                }
                setOptions(newOptions);
            }
        });

        return (): void => {
            active = false;
        };
    }, [value, inputValue, fetch]);

    return (
        <div className={classes.fieldRow}>
            <Autocomplete
                itemType="CaseReferenceForm"
                getOptionLabel={(option: string | CaseReferenceForm): string =>
                    // option is a string if the user typed a URL and did not
                    // select a dropdown value.
                    typeof option === 'string' ? option : option.sourceUrl
                }
                isOptionEqualToValue={(
                    option: CaseReferenceForm,
                    value: CaseReferenceForm,
                ): boolean => {
                    return (
                        option.sourceId === value.sourceId &&
                        option.sourceUrl === value.sourceUrl
                    );
                }}
                onChange={(
                    _: unknown,
                    newValue: CaseReferenceForm | string | null,
                ): void => {
                    // newValue is a string if the user typed a URL and did not
                    // select a dropdown value.
                    if (typeof newValue === 'string') {
                        const existingOption = options.find(
                            (option) => option.sourceUrl === newValue,
                        );
                        newValue = existingOption ?? {
                            inputValue: newValue,
                            sourceUrl: newValue,
                            isGovernmentSource: false,
                            sourceId: '',
                            sourceName: values.caseReference?.sourceName ?? '',
                            sourceLicense:
                                values.caseReference?.sourceLicense ?? '',
                            sourceProviderName:
                                values.caseReference?.sourceProviderName ?? '',
                            sourceProviderUrl:
                                values.caseReference?.sourceProviderUrl ?? '',
                            additionalSources:
                                values.caseReference?.additionalSources ||
                                ([] as unknown as [
                                    {
                                        sourceUrl: string;
                                        isGovernmentSource: boolean;
                                    },
                                ]),
                        };
                    } else {
                        if (
                            newValue &&
                            values.caseReference?.additionalSources
                        ) {
                            newValue.additionalSources =
                                values.caseReference?.additionalSources ||
                                ([] as unknown as [
                                    {
                                        sourceUrl: string;
                                        isGovernmentSource: boolean;
                                    },
                                ]);
                        }
                    }
                    if (newValue == null) {
                        newValue = {
                            inputValue: '',
                            sourceUrl: '',
                            isGovernmentSource: false,
                            sourceId: '',
                            sourceName: '',
                            sourceLicense: '',
                            sourceProviderName: '',
                            sourceProviderUrl: '',
                            additionalSources:
                                values.caseReference?.additionalSources ||
                                ([] as unknown as [
                                    {
                                        sourceUrl: string;
                                        isGovernmentSource: boolean;
                                    },
                                ]),
                        };
                    }
                    setValue(newValue);
                    setFieldValue(name, newValue);
                }}
                filterOptions={(
                    options: CaseReferenceForm[],
                    params,
                ): CaseReferenceForm[] => {
                    const filtered = filter(
                        options,
                        params,
                    ) as CaseReferenceForm[];

                    if (
                        params.inputValue !== '' &&
                        !filtered.find(
                            (caseRef) =>
                                caseRef.sourceUrl === params.inputValue,
                        ) &&
                        props.freeSolo
                    ) {
                        filtered.push({
                            inputValue: params.inputValue,
                            sourceUrl: params.inputValue,
                            isGovernmentSource:
                                values.caseReference?.isGovernmentSource ??
                                false,
                            sourceId: '',
                            sourceName: values.caseReference?.sourceName ?? '',
                            sourceLicense:
                                values.caseReference?.sourceLicense ?? '',
                            sourceProviderName:
                                values.caseReference?.sourceProviderName ?? '',
                            sourceProviderUrl:
                                values.caseReference?.sourceProviderUrl ?? '',
                            additionalSources: [] as unknown as [
                                {
                                    sourceUrl: string;
                                    isGovernmentSource: boolean;
                                },
                            ],
                        });
                    }

                    return filtered;
                }}
                autoSelect
                freeSolo={props.freeSolo}
                selectOnFocus
                blurOnSelect={'mouse'}
                disableCloseOnSelect={true}
                handleHomeEndKeys
                options={options}
                value={value}
                // onBlur={(): void => setTouched({ [name]: true })}
                onInputChange={(event, newInputValue): void => {
                    setInputValue(newInputValue);
                }}
                renderInput={(params): JSX.Element => (
                    <div>
                        {/* Do not use FastField here */}
                        <Field
                            {...params}
                            // Setting the name properly allows any typed value
                            // to be set in the form values, rather than only selected
                            // dropdown values. Thus we use an unused form value here.
                            name="unused"
                            data-testid={name}
                            label="Paste URL for data source or search"
                            placeholder="https://..."
                            component={TextField}
                            fullWidth
                            // Using custom error validation for this field
                            error={!sourceURLValidation(inputValue)}
                        />
                        {!sourceURLValidation(inputValue) && (
                            <ErrorMessage name={'caseReference.sourceUrl'}>
                                {(msg) => (
                                    <div className={classes.errorMessage}>
                                        {msg}
                                    </div>
                                )}
                            </ErrorMessage>
                        )}
                    </div>
                )}
                // renderOption={(
                //     props,
                //     option: CaseReferenceForm,
                // ): React.ReactNode => {
                //     return (
                //         <span key={option.sourceId}>
                //             <Typography
                //                 variant="body2"
                //                 onClick={() => {
                //                     const newValue = {
                //                         ...option,
                //                         additionalSources:
                //                             values.caseReference
                //                                 ?.additionalSources ||
                //                             ([] as unknown as [
                //                                 {
                //                                     sourceUrl: string;
                //                                     isGovernmentSource: boolean;
                //                                 },
                //                             ]),
                //                     };
                //                     setValue(newValue);
                //                     setFieldValue(name, newValue);
                //                 }}
                //                 sx={{ cursor: 'pointer' }}
                //             >
                //                 {option.sourceUrl}
                //             </Typography>
                //         </span>
                //     );
                // }}
            />
            {/*<Form>*/}
            {/*    <FieldArray*/}
            {/*        name="friends"*/}
            {/*        render={(arrayHelpers) => (*/}
            {/*            <div>*/}
            {/*                {values.friends && values.friends.length > 0 ? (*/}
            {/*                    values.friends.map((friend: any, index: any) => (*/}
            {/*                        <div key={index}>*/}
            {/*                            <Field name={`friends.${index}`} />*/}
            {/*                            <button*/}
            {/*                                type="button"*/}
            {/*                                onClick={() =>*/}
            {/*                                    arrayHelpers.remove(index)*/}
            {/*                                } // remove a friend from the list*/}
            {/*                            >*/}
            {/*                                -*/}
            {/*                            </button>*/}
            {/*                            <button*/}
            {/*                                type="button"*/}
            {/*                                onClick={() =>*/}
            {/*                                    arrayHelpers.insert(index, '')*/}
            {/*                                } // insert an empty string at a position*/}
            {/*                            >*/}
            {/*                                +*/}
            {/*                            </button>*/}
            {/*                        </div>*/}
            {/*                    ))*/}
            {/*                ) : (*/}
            {/*                    <button*/}
            {/*                        type="button"*/}
            {/*                        onClick={() => arrayHelpers.push('')}*/}
            {/*                    >*/}
            {/*                        /!* show this when user has removed all friends from the list *!/*/}
            {/*                        Add a friend*/}
            {/*                    </button>*/}
            {/*                )}*/}
            {/*                <div>*/}
            {/*                    <button type="submit">Submit</button>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        )}*/}
            {/*    />*/}
            {/*</Form>*/}
            {/* If this is a new source, show option to add name */}
            {/*{inputValue &&*/}
            {/*    props.freeSolo &&*/}
            {/*    !options.find((option) => option.sourceUrl === inputValue) && (*/}
            {/*        <>*/}
            {/*            <FastField*/}
            {/*                className={classes.sourceTextField}*/}
            {/*                label="Source name"*/}
            {/*                name={`${name}.sourceName`}*/}
            {/*                type="text"*/}
            {/*                data-testid="sourceName"*/}
            {/*                component={TextField}*/}
            {/*                fullWidth*/}
            {/*            />*/}
            {/*            <FastField*/}
            {/*                className={classes.sourceTextField}*/}
            {/*                label="Source license"*/}
            {/*                name={`${name}.sourceLicense`}*/}
            {/*                type="text"*/}
            {/*                data-testid="sourceLicense"*/}
            {/*                component={TextField}*/}
            {/*                fullWidth*/}
            {/*            />*/}
            {/*            <FastField*/}
            {/*                className={classes.sourceTextField}*/}
            {/*                label="Source provider name"*/}
            {/*                name={`${name}.sourceProviderName`}*/}
            {/*                type="text"*/}
            {/*                data-testid="sourceProviderName"*/}
            {/*                component={TextField}*/}
            {/*                fullWidth*/}
            {/*            />*/}
            {/*            <FastField*/}
            {/*                className={classes.sourceTextField}*/}
            {/*                label="Source provider website"*/}
            {/*                name={`${name}.sourceProviderUrl`}*/}
            {/*                type="text"*/}
            {/*                data-testid="sourceProviderUrl"*/}
            {/*                component={TextField}*/}
            {/*                fullWidth*/}
            {/*            />*/}
            {/*        </>*/}
            {/*    )}*/}
        </div>
    );
}
