import React, { useEffect, useState } from 'react';

import { Case } from '../api/models/Case';
import CaseForm from './CaseForm';
import { LinearProgress } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import axios from 'axios';
import { Day0Case, ParsedCase } from '../api/models/Day0Case';
import { parseCase } from '../redux/linelistTable/thunk';

interface Props {
    id: string;
    onModalClose: () => void;
    diseaseName: string;
}

export default function EditCase(props: Props): JSX.Element {
    const [c, setCase] = useState<ParsedCase>();
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>();

    useEffect(() => {
        setLoading(true);
        axios
            .get<Day0Case[]>(`/api/cases/${props.id}`)
            .then((resp) => {
                setCase(parseCase(resp.data[0]));
                setErrorMessage(undefined);
            })
            .catch((e) => {
                setCase(undefined);
                setErrorMessage(e.response?.data?.message || e.toString());
            })
            .finally(() => setLoading(false));
    }, [props.id]);

    return (
        <div>
            {loading && <LinearProgress />}
            {errorMessage && (
                <MuiAlert elevation={6} variant="filled" severity="error">
                    {errorMessage}
                </MuiAlert>
            )}
            {c && (
                <CaseForm
                    initialCase={c}
                    onModalClose={props.onModalClose}
                    diseaseName={props.diseaseName}
                />
            )}
        </div>
    );
}
