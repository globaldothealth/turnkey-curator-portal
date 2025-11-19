import React, { useState, useEffect } from 'react';
import MaterialTable from '@material-table/core';
import { Button, Paper } from '@mui/material';
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
        marginTop: '70px',
        padding: '16px',
        marginBottom: '30px',
    },
    dataAcknowledgementText: {
        textAlign: 'justify',
    },
}));

const DataDownloads = () => {
    const { classes } = dataDownloadsStyles();
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const agreedToDataAcknowledgement = user?.roles.includes(Role.Researcher);
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
            <Paper className={classes.paper}>
                <h2>Data Acknowledgement</h2>
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
                                render: (rowData) =>
                                    rowData && (
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
                                            disabled={
                                                !agreedToDataAcknowledgement
                                            }
                                        >
                                            Download
                                        </Button>
                                    ),
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
