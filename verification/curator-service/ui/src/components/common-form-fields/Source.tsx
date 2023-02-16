import { Autocomplete } from '@mui/material';
import { createFilterOptions } from '@mui/material/useAutocomplete';
import { FastField, Field, useFormikContext } from 'formik';
import { Typography } from '@mui/material';

import makeStyles from '@mui/styles/makeStyles';

import BulkCaseFormValues from '../bulk-case-form-fields/BulkCaseFormValues';
import FieldTitle from './FieldTitle';
import React, { useState } from 'react';
import { RequiredHelperText } from './FormikFields';
import Scroll from 'react-scroll';
import { TextField } from 'formik-mui';
import { StyledTooltip } from '../new-case-form-fields/StyledTooltip';
import axios from 'axios';
import { throttle } from 'lodash';
import {
    Day0CaseFormValues,
    CaseReference,
    ISource,
} from '../../api/models/Day0Case';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { TextField as MuiTextField } from '@mui/material';

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

const useSourceStyles = makeStyles(() => ({
    additionalSources: {
        width: '50%',
    },
    hidden: {
        display: 'none',
    },
}));

export default function Source(props: SourceProps) {
    const classes = useSourceStyles();
    const [additionalSourceNum, setAdditionalSourceNum] = useState(1);
    const { setFieldValue, values } = useFormikContext<
        Day0CaseFormValues | BulkCaseFormValues
    >();

    const freeSolo = props.freeSolo === undefined ? true : props.freeSolo;

    const handleadditionalSourceClick = () => {
        if (additionalSourceNum >= 7) return;

        setAdditionalSourceNum((state) => state + 1);
    };

    const renderedAdditionalSources = () => {
        const fields = [];
        for (let i = 2; i <= additionalSourceNum; i++) {
            const additionalSources = values.caseReference?.additionalSources;

            fields.push(
                <MuiTextField
                    key={`source${i}`}
                    label={`Source ${i}`}
                    type="text"
                    data-testid={`source${i}`}
                    margin="normal"
                    fullWidth
                    value={
                        additionalSources && additionalSources[i - 2]
                            ? additionalSources[i - 2].sourceUrl
                            : ''
                    }
                    onChange={(event) => {
                        setFieldValue(
                            `caseReference.additionalSources.${
                                i - 2
                            }.sourceUrl`,
                            event.target.value,
                        );
                    }}
                />,
            );
        }

        return fields;
    };

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
            {props.withAdditioanlSources && (
                <div className={classes.additionalSources}>
                    {renderedAdditionalSources()}
                </div>
            )}

            {props.withAdditioanlSources && additionalSourceNum < 7 && (
                <Button
                    variant="outlined"
                    id="add-additional-sources"
                    startIcon={<AddIcon />}
                    onClick={handleadditionalSourceClick}
                    sx={{ marginTop: '1rem' }}
                >
                    Add additional source
                </Button>
            )}
        </Scroll.Element>
    );
}

interface OriginData {
    url: string;
    license: string;
    providerName?: string;
    providerWebsiteUrl?: string;
}

interface SourceData {
    _id: string;
    name: string;
    origin: OriginData;
    hasStableIdentifiers?: boolean;
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
}

export async function submitSource(opts: {
    name: string;
    url: string;
    license: string;
    format?: string;
    providerName?: string;
    providerWebsiteUrl?: string;
}): Promise<CaseReference> {
    const newSource = {
        name: opts.name,
        origin: {
            url: opts.url,
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
        additionalSources: [] as unknown as [{ sourceUrl: string }],
    };
}

const filter = createFilterOptions<ISource>();

const useStyles = makeStyles(() => ({
    sourceTextField: {
        marginTop: '1em',
    },
    fieldRow: {
        maxWidth: '50%',
    },
}));

export function SourcesAutocomplete(
    props: SourceAutocompleteProps,
): JSX.Element {
    const classes = useStyles();
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
            return !!pattern.test(str);
        } else {
            return true;
        }
    };

    React.useEffect(() => {
        let active = true;

        fetch({ url: inputValue }, (results?: SourceData[]) => {
            if (active) {
                let newOptions = [] as ISource[];

                if (results) {
                    newOptions = [
                        ...newOptions,
                        ...results.map((source) => ({
                            sourceId: source._id,
                            sourceUrl: source.origin.url,
                            sourceName: source.name,
                            sourceLicense: source.origin.license,
                            sourceProviderName: source.origin.providerName,
                            sourceProviderUrl: source.origin.providerWebsiteUrl,
                            additionalSources: [] as unknown as [
                                { sourceUrl: string },
                            ],
                        })),
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
                            sourceId: '',
                            sourceName: values.caseReference?.sourceName ?? '',
                            sourceLicense:
                                values.caseReference?.sourceLicense ?? '',
                            sourceProviderName:
                                values.caseReference?.sourceProviderName ?? '',
                            sourceProviderUrl:
                                values.caseReference?.sourceProviderUrl ?? '',
                            additionalSources: [] as unknown as [
                                { sourceUrl: string },
                            ],
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
                            sourceId: '',
                            sourceName: values.caseReference?.sourceName ?? '',
                            sourceLicense:
                                values.caseReference?.sourceLicense ?? '',
                            sourceProviderName:
                                values.caseReference?.sourceProviderName ?? '',
                            sourceProviderUrl:
                                values.caseReference?.sourceProviderUrl ?? '',
                            additionalSources: [] as unknown as [
                                { sourceUrl: string },
                            ],
                        });
                    }

                    return filtered;
                }}
                autoSelect
                freeSolo={props.freeSolo}
                selectOnFocus
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
                        />
                        <RequiredHelperText
                            name={name}
                            wrongUrl={sourceURLValidation(inputValue)}
                        />
                    </div>
                )}
                renderOption={(
                    props,
                    option: CaseReferenceForm,
                ): React.ReactNode => {
                    return (
                        <span key={option.sourceId}>
                            <Typography
                                variant="body2"
                                onClick={() => {
                                    setValue(option);
                                    setFieldValue(name, option);
                                }}
                                sx={{ cursor: 'pointer' }}
                            >
                                {option.sourceUrl}
                            </Typography>
                        </span>
                    );
                }}
            />
            {/* If this is a new source, show option to add name */}
            {inputValue &&
                props.freeSolo &&
                !options.find((option) => option.sourceUrl === inputValue) && (
                    <>
                        <FastField
                            className={classes.sourceTextField}
                            label="Source name"
                            name={`${name}.sourceName`}
                            helperText="Required"
                            type="text"
                            data-testid="sourceName"
                            component={TextField}
                            fullWidth
                        />
                        <FastField
                            className={classes.sourceTextField}
                            label="Source license"
                            name={`${name}.sourceLicense`}
                            helperText="Required"
                            type="text"
                            data-testid="sourceLicense"
                            component={TextField}
                            fullWidth
                        />
                        <FastField
                            className={classes.sourceTextField}
                            label="Source provider name"
                            name={`${name}.sourceProviderName`}
                            type="text"
                            data-testid="sourceProviderName"
                            component={TextField}
                            fullWidth
                        />
                        <FastField
                            className={classes.sourceTextField}
                            label="Source provider website"
                            name={`${name}.sourceProviderUrl`}
                            type="text"
                            data-testid="sourceProviderUrl"
                            component={TextField}
                            fullWidth
                        />
                    </>
                )}
        </div>
    );
}
