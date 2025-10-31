import React from 'react';
import MaterialTable from '@material-table/core';
import { Button, Paper } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { SaveAlt as SaveAltIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { agreeToDataAcknowledgement } from '../../redux/auth/thunk';
import { selectUser } from '../../redux/auth/selectors';
import { Role } from '../../api/models/User';

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
    }
}));

const DataDownloads = () => {
    const { classes } = dataDownloadsStyles();
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const agreedToDataAcknowledgement = user?.roles.includes(Role.Researcher)


    const downloadDataButtonOnClick = async (filename: string) => { try {
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
    }}

    const tableData = [
        {
            name: 'Logo',
            description:
                'An object used for testing curator portal data downloads',
            filename: 'logo.png',
        },
        {
            name: 'Cattle',
            description: 'Cattle Dataset for Avian Influenza 2024',
            filename: 'cattle/latest.csv',
        },
    ];

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
                    onClick={() =>
                        dispatch(agreeToDataAcknowledgement())
                    }
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
                <MaterialTable
                    options={{
                        search: true,
                        paging: false,
                        searchFieldAlignment: 'right',
                    }}
                    columns={[
                        {
                            title: 'Name',
                            field: 'name',
                            defaultSort: 'asc',
                            width: '200px',
                        },
                        {
                            title: 'Description',
                            field: 'description',
                        },
                        {
                            title: '',
                            field: 'filename',
                            width: '120px',
                            render: (rowData) =>
                                rowData && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() =>
                                            downloadDataButtonOnClick(rowData.filename)
                                        }
                                        startIcon={<SaveAltIcon />}
                                        sx={{
                                            whiteSpace: 'nowrap',
                                            minWidth: '140px',
                                        }}
                                        disabled={!agreedToDataAcknowledgement}
                                    >
                                        Download
                                    </Button>
                                ),
                        },
                    ]}
                    data={tableData}
                    title="Data downloads"
                />
            </Paper>
        </>
    );
};

export default DataDownloads;
