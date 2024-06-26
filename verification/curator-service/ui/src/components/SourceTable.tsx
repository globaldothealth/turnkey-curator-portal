import React, { RefObject } from 'react';
import axios from 'axios';
import {
    Alert as MuiAlert,
    Button,
    Checkbox,
    Divider,
    MenuItem,
    Paper,
    Switch,
    TextField,
    Theme,
    Typography,
} from '@mui/material';
import { withStyles } from 'tss-react/mui';
import MaterialTable, { QueryResult } from '@material-table/core';

import ChipInput from './ChipInput';
import SourceRetrievalButton from './SourceRetrievalButton';
import { nameCountry } from './util/countryNames';

interface Origin {
    url: string;
    isGovernmentSource: boolean;
    license: string;
    providerName?: string;
    providerWebsiteUrl?: string;
}

interface DateFilter {
    numDaysBeforeToday?: number;
    op?: string;
}

interface Source {
    _id: string;
    name: string;
    countryCodes: string[];
    format?: string;
    origin: Origin;
    dateFilter?: DateFilter;
    notificationRecipients?: string[];
    excludeFromLineList?: boolean;
    hasStableIdentifiers?: boolean;
}

interface ListResponse {
    sources: Source[];
    nextPage: number;
    total: number;
}

interface SourceTableState {
    url: string;
    error: string;
    pageSize: number;
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    _id: string;
    name: string;
    isGovernmentSource: boolean;
    countryCodes: string; // flattened
    // origin
    url: string;
    license: string;
    providerName?: string;
    providerWebsiteUrl?: string;

    // automation.parser
    format?: string;
    dateFilter?: DateFilter;
    notificationRecipients?: string[];
    excludeFromLineList?: boolean;
    hasStableIdentifiers?: boolean;
}

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
type Props = {
    className?: string;
    classes?: Partial<
        Record<
            | 'error'
            | 'alert'
            | 'divider'
            | 'spacer'
            | 'tablePaginationBar'
            | 'tableTitle'
            | 'sourcesSection',
            string
        >
    >;
};
class SourceTable extends React.Component<Props, SourceTableState> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableRef: RefObject<any> = React.createRef();

    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/sources/',
            error: '',
            pageSize: 10,
        };
    }

    deleteSource(rowData: TableRow): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const deleteUrl = this.state.url + rowData._id;
            this.setState({ error: '' });
            const response = axios.delete(deleteUrl);
            response.then(resolve).catch((e) => {
                this.setState({
                    error: e.response?.data?.message || e.toString(),
                });
                reject(e);
            });
        });
    }

    editSource(
        newRowData: TableRow,
        oldRowData: TableRow | undefined,
    ): Promise<unknown> {
        return new Promise((resolve, reject) => {
            if (oldRowData === undefined) {
                return reject();
            }
            if (
                !(
                    this.validateRequired(newRowData.name) &&
                    this.validateRequired(newRowData.url) &&
                    this.validateRequired(newRowData.license) &&
                    this.validateCountryCodes(newRowData.countryCodes)
                )
            ) {
                return reject();
            }
            const newSource = this.updateSourceFromRowData(newRowData);
            const response = axios.put(
                this.state.url + oldRowData._id,
                newSource,
            );
            response
                .then(() => {
                    this.setState({ error: '' });
                    resolve(undefined);
                })
                .catch((e) => {
                    /*
                     * Warning: this is not a nice kludge.
                     * Updating the source can fail for multiple reasons:
                     * 1. our backend won't save the update
                     * 2. AWS won't accept the scheduling update
                     * 3. The email notifying curators of the update doesn't get sent.
                     *
                     * Here, we check for the third case (email didn't get sent), and
                     * call that a success anyway, so the table updates with the genuine
                     * current values.
                     */

                    if (e.response?.data?.name === 'NotificationSendError') {
                        this.setState({
                            error: 'Failed to send e-mail notifications to registered addresses',
                        });
                        resolve(undefined);
                    } else {
                        this.setState({
                            error: e.response?.data?.message || e.toString(),
                        });
                        reject(e);
                    }
                });
        });
    }

    /**
     * Updates a source from the provided table row data.
     *
     * Unlike for creation, an AWS rule ARN may be supplied alongside a
     * schedule expression (and optionally, a parser Lambda ARN).
     */
    updateSourceFromRowData(rowData: TableRow): Source {
        return {
            _id: rowData._id,
            name: rowData.name,
            countryCodes: rowData.countryCodes?.split(',') ?? [],
            origin: {
                url: rowData.url,
                isGovernmentSource: rowData.isGovernmentSource,
                license: rowData.license,
                providerName: rowData.providerName,
                providerWebsiteUrl: rowData.providerWebsiteUrl,
            },
            format: rowData.format,
            dateFilter:
                rowData.dateFilter?.numDaysBeforeToday || rowData.dateFilter?.op
                    ? rowData.dateFilter
                    : {},
            notificationRecipients: rowData.notificationRecipients,
            excludeFromLineList: rowData.excludeFromLineList,
            hasStableIdentifiers: rowData.hasStableIdentifiers,
        };
    }

    /**
     * Validates fields comprising the source.automation object.
     */
    validateRequired(field: string | undefined): boolean {
        return field?.trim() !== '';
    }

    validateCountryCode(cc: string): boolean {
        // use ZZ to represent all countries
        return nameCountry(cc) !== undefined || cc.toUpperCase() === 'ZZ';
    }

    validateCountryCodes(field: string | undefined): boolean {
        // ensure at least one country present
        if (field === undefined) return false;
        const countryCodes = field?.split(',');
        return countryCodes?.every(this.validateCountryCode);
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <Paper className={classes?.sourcesSection}>
                {this.state.error && (
                    <MuiAlert
                        classes={{ root: classes?.alert }}
                        variant="filled"
                        severity="error"
                    >
                        {this.state.error}
                    </MuiAlert>
                )}
                <MaterialTable
                    tableRef={this.tableRef}
                    title={<Typography>Ingestion sources</Typography>}
                    columns={[
                        { title: 'ID', field: '_id', editable: 'never' },
                        {
                            title: 'Name',
                            field: 'name',
                            editComponent: (props): JSX.Element => (
                                <TextField
                                    type="text"
                                    size="small"
                                    fullWidth
                                    placeholder="Name"
                                    error={!this.validateRequired(props.value)}
                                    helperText={
                                        this.validateRequired(props.value)
                                            ? ''
                                            : 'Required field'
                                    }
                                    onChange={(event): void =>
                                        props.onChange(event.target.value)
                                    }
                                    defaultValue={props.value}
                                />
                            ),
                        },
                        {
                            title: 'Government Source',
                            field: 'isGovernmentSource',
                            type: 'boolean',
                            editComponent: (props): JSX.Element => (
                                <Checkbox
                                    onChange={(): void =>
                                        props.onChange(!props.value)
                                    }
                                    checked={props.value}
                                />
                            ),
                        },
                        {
                            title: 'Country Codes',
                            field: 'countryCodes',
                            editComponent: (props): JSX.Element => (
                                <TextField
                                    type="text"
                                    size="small"
                                    fullWidth
                                    placeholder="ISO 3166-1 alpha-2, comma separated"
                                    error={
                                        !this.validateCountryCodes(props.value)
                                    }
                                    helperText={
                                        this.validateCountryCodes(props.value)
                                            ? ''
                                            : 'Required: two letter country codes'
                                    }
                                    onChange={(event): void =>
                                        props.onChange(event.target.value)
                                    }
                                    defaultValue={props.value}
                                />
                            ),
                        },
                        {
                            title: 'URL',
                            field: 'url',
                            editComponent: (props): JSX.Element => (
                                <TextField
                                    type="text"
                                    size="small"
                                    fullWidth
                                    placeholder="URL"
                                    error={!this.validateRequired(props.value)}
                                    helperText={
                                        this.validateRequired(props.value)
                                            ? ''
                                            : 'Required field'
                                    }
                                    onChange={(event): void =>
                                        props.onChange(event.target.value)
                                    }
                                    defaultValue={props.value}
                                />
                            ),
                        },
                        {
                            title: 'Format',
                            field: 'format',
                            editComponent: (props): JSX.Element => (
                                <TextField
                                    select
                                    size="small"
                                    fullWidth
                                    data-testid="format-select"
                                    placeholder="Format"
                                    onChange={(event): void =>
                                        props.onChange(event.target.value)
                                    }
                                    defaultValue={props.value || ''}
                                >
                                    {['', 'JSON', 'CSV', 'XLSX'].map(
                                        (value) => (
                                            <MenuItem
                                                key={`format-${value}`}
                                                value={value || ''}
                                            >
                                                {value || 'Unknown'}
                                            </MenuItem>
                                        ),
                                    )}
                                </TextField>
                            ),
                        },
                        {
                            title: 'License',
                            field: 'license',
                            tooltip: 'MIT, Apache V2, ...',
                            editComponent: (props): JSX.Element => (
                                <TextField
                                    type="text"
                                    size="small"
                                    fullWidth
                                    placeholder="License"
                                    error={!this.validateRequired(props.value)}
                                    helperText={
                                        this.validateRequired(props.value)
                                            ? ''
                                            : 'Required field'
                                    }
                                    onChange={(event): void =>
                                        props.onChange(event.target.value)
                                    }
                                    defaultValue={props.value}
                                />
                            ),
                        },
                        {
                            title: 'Provider Name',
                            field: 'providerName',
                            tooltip:
                                'Miskatonic University Department of Medecine',
                            editComponent: (props): JSX.Element => (
                                <TextField
                                    type="text"
                                    size="small"
                                    fullWidth
                                    placeholder="Provider Name"
                                    error={!this.validateRequired(props.value)}
                                    helperText={
                                        this.validateRequired(props.value)
                                            ? ''
                                            : 'Required field'
                                    }
                                    onChange={(event): void =>
                                        props.onChange(event.target.value)
                                    }
                                    defaultValue={props.value}
                                />
                            ),
                        },
                        {
                            title: 'Provider Website',
                            field: 'providerWebsiteUrl',
                            tooltip: 'https://medsci.miskatonic.edu/',
                            editComponent: (props): JSX.Element => (
                                <TextField
                                    type="text"
                                    size="small"
                                    fullWidth
                                    placeholder="Provider Website"
                                    error={!this.validateRequired(props.value)}
                                    helperText={
                                        this.validateRequired(props.value)
                                            ? ''
                                            : 'Required field'
                                    }
                                    onChange={(event): void =>
                                        props.onChange(event.target.value)
                                    }
                                    defaultValue={props.value}
                                />
                            ),
                        },
                        {
                            title: 'Notification recipients',
                            field: 'notificationRecipients',
                            tooltip:
                                'Email addresses of parties to be notified of critical changes',
                            render: (rowData): string =>
                                rowData.notificationRecipients
                                    ? rowData.notificationRecipients?.join('\n')
                                    : '',
                            editComponent: (props): JSX.Element => (
                                <ChipInput
                                    label="Notification recipients"
                                    placeholder="Email address(es)"
                                    values={props.value}
                                    defaultValue={props.value || []}
                                    onChange={(values) =>
                                        props.onChange(values)
                                    }
                                />
                            ),
                        },
                        {
                            title: 'Date filtering',
                            field: 'dateFilter',
                            render: (rowData): JSX.Element =>
                                rowData.dateFilter?.op === 'EQ' ? (
                                    <div>
                                        Only parse data from{' '}
                                        {rowData.dateFilter?.numDaysBeforeToday}{' '}
                                        day(s) ago
                                    </div>
                                ) : rowData.dateFilter?.op === 'LT' ? (
                                    <div>
                                        Parse all data up to{' '}
                                        {rowData.dateFilter?.numDaysBeforeToday}{' '}
                                        day(s) ago
                                    </div>
                                ) : rowData.dateFilter?.op === 'GT' ? (
                                    <div>
                                        Parse all data after{' '}
                                        {rowData.dateFilter?.numDaysBeforeToday}{' '}
                                        day(s) ago
                                    </div>
                                ) : (
                                    <div>None</div>
                                ),
                            editComponent: (props): JSX.Element => (
                                <>
                                    Only parse data
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        data-testid="op-select"
                                        placeholder="Operator"
                                        onChange={(event): void =>
                                            props.onChange({
                                                numDaysBeforeToday:
                                                    props.value
                                                        ?.numDaysBeforeToday,
                                                op: event.target.value,
                                            })
                                        }
                                        value={props.value?.op || ''}
                                    >
                                        {[
                                            { text: 'Unknown', value: '' },
                                            {
                                                text: 'from exactly',
                                                value: 'EQ',
                                            },
                                            { text: 'up to', value: 'LT' },
                                            { text: 'after', value: 'GT' },
                                        ].map((pair) => (
                                            <MenuItem
                                                key={`op-${pair.value}`}
                                                value={pair.value || ''}
                                            >
                                                {pair.text}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        data-testid="num-days"
                                        placeholder="days"
                                        onChange={(event): void =>
                                            props.onChange({
                                                numDaysBeforeToday: Number(
                                                    event.target.value,
                                                ),
                                                op: props.value?.op,
                                            })
                                        }
                                        value={
                                            props.value?.numDaysBeforeToday ||
                                            ''
                                        }
                                    ></TextField>
                                    days ago
                                    <Divider
                                        variant="middle"
                                        className={classes?.divider}
                                    />
                                    <Button
                                        variant="contained"
                                        data-testid="clear-date-filter"
                                        onClick={() => {
                                            props.onChange({});
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </>
                            ),
                        },
                        {
                            title: 'Curation actions',
                            render: (row): JSX.Element => (
                                <SourceRetrievalButton sourceId={row._id} />
                            ),
                            editable: 'never',
                        },
                        {
                            title: 'Exclude from line list?',
                            field: 'excludeFromLineList',
                            render: (row): JSX.Element => (
                                <Switch
                                    disabled
                                    checked={row.excludeFromLineList ?? false}
                                />
                            ),
                            editComponent: (props): JSX.Element => (
                                <Switch
                                    checked={props.value ?? false}
                                    onChange={(event): void => {
                                        props.onChange(event.target.checked);
                                    }}
                                />
                            ),
                        },
                        {
                            title: 'Source has stable case identifiers?',
                            field: 'hasStableIdentifiers',
                            render: (row): JSX.Element => (
                                <Switch
                                    disabled
                                    checked={row.hasStableIdentifiers ?? false}
                                />
                            ),
                            editComponent: (props): JSX.Element => (
                                // assume false because that's the more likely case
                                <Switch
                                    checked={props.value ?? false}
                                    onChange={(event): void => {
                                        props.onChange(event.target.checked);
                                    }}
                                />
                            ),
                        },
                    ]}
                    data={(query): Promise<QueryResult<TableRow>> =>
                        new Promise((resolve, reject) => {
                            let listUrl = this.state.url;
                            listUrl += '?limit=' + this.state.pageSize;
                            listUrl += '&page=' + (query.page + 1);
                            this.setState({ error: '' });
                            const response = axios.get<ListResponse>(listUrl);
                            response
                                .then((result) => {
                                    const flattenedSources: TableRow[] = [];
                                    const sources = result.data.sources;
                                    for (const s of sources) {
                                        flattenedSources.push({
                                            _id: s._id,
                                            name: s.name,
                                            isGovernmentSource:
                                                s.origin.isGovernmentSource,
                                            countryCodes:
                                                s.countryCodes?.join(',') ?? '',
                                            format: s.format,
                                            url: s.origin.url,
                                            license: s.origin.license,
                                            providerName: s.origin.providerName,
                                            providerWebsiteUrl:
                                                s.origin.providerWebsiteUrl,
                                            dateFilter: s.dateFilter,
                                            notificationRecipients:
                                                s.notificationRecipients,
                                            excludeFromLineList:
                                                s.excludeFromLineList,
                                            hasStableIdentifiers:
                                                s.hasStableIdentifiers,
                                        });
                                    }
                                    resolve({
                                        data: flattenedSources,
                                        page: query.page,
                                        totalCount: result.data.total,
                                    });
                                })
                                .catch((e) => {
                                    this.setState({
                                        error:
                                            e.response?.data?.message ||
                                            e.toString(),
                                    });
                                    reject(e);
                                });
                        })
                    }
                    components={{
                        Container: (props): JSX.Element => (
                            <Paper elevation={0} {...props}></Paper>
                        ),
                    }}
                    style={{ fontFamily: 'Inter' }}
                    options={{
                        // TODO: Create text indexes and support search queries.
                        // https://docs.mongodb.com/manual/text-search/
                        search: false,
                        filtering: false,
                        emptyRowsWhenPaging: false,
                        padding: 'dense',
                        draggable: false, // No need to be able to drag and drop headers.
                        pageSize: this.state.pageSize,
                        pageSizeOptions: [5, 10, 20, 50, 100],
                        paginationPosition: 'bottom',
                        maxBodyHeight: 'calc(100vh - 15em)',
                        headerStyle: {
                            zIndex: 1,
                        },
                    }}
                    onRowsPerPageChange={(newPageSize: number) => {
                        this.setState({ pageSize: newPageSize });
                        this.tableRef.current.onQueryChange();
                    }}
                    editable={{
                        onRowUpdate: (
                            newRowData: TableRow,
                            oldRowData: TableRow | undefined,
                        ): Promise<unknown> =>
                            this.editSource(newRowData, oldRowData),
                        onRowDelete: (rowData: TableRow): Promise<unknown> =>
                            this.deleteSource(rowData),
                    }}
                />
            </Paper>
        );
    }
}

const SourceTableStyled = withStyles(SourceTable, (theme: Theme) => ({
    error: {
        color: theme.palette.error.main,
        marginTop: theme.spacing(2),
    },
    alert: {
        borderRadius: theme.spacing(1),
        marginTop: theme.spacing(2),
    },
    divider: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
    spacer: { flex: 1 },
    tablePaginationBar: {
        alignItems: 'center',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        height: '64px',
    },
    tableTitle: {
        width: '10%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sourcesSection: {
        marginTop: '64px',
    },
}));

export default SourceTableStyled;
