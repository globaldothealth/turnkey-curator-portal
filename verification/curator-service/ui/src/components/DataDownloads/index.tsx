import React, { useState, useEffect } from 'react';
import MaterialTable from '@material-table/core';
import { Button, Grid, Paper, Tooltip } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { SaveAlt as SaveAltIcon } from '@mui/icons-material';
import axios from 'axios';

import { Role } from '../../api/models/User';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../redux/auth/selectors';
import { agreeToDataAcknowledgement } from '../../redux/auth/thunk';

const dataDownloadsStyles = makeStyles()(() => ({
    cell: {
        padding: '16px',
        fontWeight: 'bold',
        textAlign: 'right',
    },
    firstCell: {
        padding: '16px',
        fontWeight: 'bold',
    },
    paper: {
        padding: '16px',
        marginBottom: '30px',
    },
    dataAcknowledgementText: {
        textAlign: 'justify',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '500',
        margin: '0',
    },
    toolTile: {
        height: '100%',
        paddingBottom: '20px',
        textAlign: 'center',
    },
    toolImg: {
        width: '60%',
        marginBottom: '10px',
    },
}));

const DataDownloads = () => {
    const { classes } = dataDownloadsStyles();
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const userIsResearcher = user?.roles.includes(Role.Researcher);
    const agreedToDataAcknowledgement =
        userIsResearcher || user?.roles.includes(Role.PendingResearcher);
    const [tableData, setTableData] = useState<[{ country: string }]>();
    const [countries, setCountries2] = useState({});

    useEffect(() => {
        axios
            .get(
                'https://gh-data-downloads.s3.eu-central-1.amazonaws.com/metadata.json',
            )
            .then(function (response) {
                const data: [{ country: string }] = response.data;
                setTableData(data);

                const uniqueCountries: string[] = [
                    ...new Set(data.map((row) => row.country)),
                ];
                // Map counties list to dict
                setCountries2(
                    uniqueCountries.reduce(
                        (
                            p: { [id: string]: string },
                            c: string,
                        ): { [id: string]: string } => {
                            p[c] = c;
                            return p;
                        },
                        {},
                    ),
                );
            });
    }, []);

    const downloadDataButtonOnClick = async (filename: string) => {
        try {
            const response = await axios({
                method: 'post',
                url: '/api/cases/getDataDownloadLink',
                data: { filename },
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            window.location.href = response.data.signedUrl;
        } catch (error) {
            if (!error.response) throw error;
        }
    };

    return (
        <>
            <Paper className={classes.paper} style={{ marginTop: '70px' }}>
                <h6 className={classes.sectionTitle}>G.h Tools</h6>
                {/*<p className={classes.dataAcknowledgementText}>*/}
                {/*    SOME DESCRIPTION FOR HACKATHON TOOLS*/}
                {/*</p>*/}
                <Grid container spacing={2}>
                    <Grid
                        item
                        xs={12}
                        sm={12}
                        md={3}
                        order={{ xs: 1, sm: 1, md: 0 }}
                    >
                        <Paper className={classes.toolTile}>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={
                                    'https://dev-globalhealth.pantheonsite.io/tools/grapevne/'
                                }
                            >
                                <img
                                    className={classes.toolImg}
                                    src="https://dev-globalhealth.pantheonsite.io/wp-content/uploads/2025/05/grapevne-logo.jpg"
                                ></img>
                            </a>
                            <br />A graphical platform for building and
                            validating infectious disease pipelines.
                        </Paper>
                    </Grid>
                    <Grid
                        item
                        xs={12}
                        sm={12}
                        md={3}
                        order={{ xs: 0, sm: 0, md: 1 }}
                    >
                        <Paper className={classes.toolTile}>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={
                                    'https://dev-globalhealth.pantheonsite.io/tools/dart/'
                                }
                            >
                                <img
                                    className={classes.toolImg}
                                    src="https://dev-globalhealth.pantheonsite.io/wp-content/uploads/2025/11/dart-square-logo.png"
                                ></img>
                            </a>
                            <br />
                            Scalable, open-access and multidisciplinary data
                            integration pipeline for climate-sensitive diseases.
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={12} md={3} order={2}>
                        <Paper className={classes.toolTile}>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={
                                    'https://dev-globalhealth.pantheonsite.io/tools/insightboard/'
                                }
                            >
                                <img
                                    className={classes.toolImg}
                                    src="https://dev-globalhealth.pantheonsite.io/wp-content/uploads/2025/10/insight-board-logo.png"
                                ></img>
                            </a>
                            <br />
                            Open-source AI-assisted tool for integrating,
                            cleaning, and visualizing infectious disease
                            outbreak data.
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>

            <Paper className={classes.paper}>
                <h2 className={classes.sectionTitle}>Data Acknowledgement</h2>
                <p className={classes.dataAcknowledgementText}>
                    By participating in this hackathon and accessing the
                    provided datasets, you agree to handle all data responsibly
                    and in accordance with ethical research and data protection
                    standards. The data may contain sensitive information and is
                    provided solely for use within the event. It must not be
                    copied, redistributed, or used for any commercial,
                    publication, or personal purposes without prior written
                    permission from the organizers. Participants may not attempt
                    to re-identify individuals, share data externally, or use it
                    for any purpose beyond the hackathon. Robust data security
                    must be maintained, and all copies must be deleted after the
                    event. Any misuse, breach of confidentiality, or unethical
                    conduct may result in removal from the event or further
                    action by the organizers. By downloading or using the
                    provided data, you acknowledge that you have read,
                    understood, and agreed to comply with these terms.
                </p>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => dispatch(agreeToDataAcknowledgement())}
                    sx={{
                        whiteSpace: 'nowrap',
                        minWidth: '140px',
                    }}
                    disabled={agreedToDataAcknowledgement}
                >
                    {agreedToDataAcknowledgement ? 'Already Agreed' : 'Agree'}
                </Button>
            </Paper>
            <Paper>
                {tableData && (
                    <MaterialTable
                        options={{
                            search: true,
                            paging: false,
                            searchFieldAlignment: 'right',
                            filtering: true,
                        }}
                        columns={[
                            {
                                title: 'Name',
                                field: 'name',
                                defaultSort: 'asc',
                                width: '200px',
                                filtering: false,
                            },
                            {
                                title: 'Country',
                                field: 'country',
                                lookup: countries,
                            },
                            {
                                title: 'Description',
                                field: 'description',
                                filtering: false,
                            },
                            {
                                title: '',
                                field: 'filename',
                                width: '120px',
                                filtering: false,
                                render: (rowData) => {
                                    if (userIsResearcher) {
                                        return (
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() =>
                                                    downloadDataButtonOnClick(
                                                        rowData.filename,
                                                    )
                                                }
                                                startIcon={<SaveAltIcon />}
                                                sx={{
                                                    whiteSpace: 'nowrap',
                                                    minWidth: '140px',
                                                }}
                                            >
                                                Download
                                            </Button>
                                        );
                                    } else if (agreedToDataAcknowledgement) {
                                        return (
                                            <Tooltip
                                                placement="left"
                                                title={
                                                    'To access file downloads your account must be verified by the G.h Administrator'
                                                }
                                            >
                                                <span>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() =>
                                                            downloadDataButtonOnClick(
                                                                rowData.filename,
                                                            )
                                                        }
                                                        startIcon={
                                                            <SaveAltIcon />
                                                        }
                                                        sx={{
                                                            whiteSpace:
                                                                'nowrap',
                                                            minWidth: '140px',
                                                        }}
                                                        disabled={true}
                                                    >
                                                        Download
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        );
                                    }
                                    return (
                                        <Tooltip
                                            placement="left"
                                            title={
                                                'To access file downloads you must agree to Data Acknowledgement and your account must be verified by the G.h Administrator'
                                            }
                                        >
                                            <span>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() =>
                                                        downloadDataButtonOnClick(
                                                            rowData.filename,
                                                        )
                                                    }
                                                    startIcon={<SaveAltIcon />}
                                                    sx={{
                                                        whiteSpace: 'nowrap',
                                                        minWidth: '140px',
                                                    }}
                                                    disabled={true}
                                                >
                                                    Download
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    );
                                },
                            },
                        ]}
                        data={tableData}
                        title="Data downloads"
                    />
                )}
            </Paper>
        </>
    );
};

export default DataDownloads;
