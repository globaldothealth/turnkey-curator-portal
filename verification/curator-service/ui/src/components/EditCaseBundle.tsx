import { useEffect, useState } from 'react';
import CaseForm from './CaseForm';
import { LinearProgress } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Day0Case } from '../api/models/Day0Case';

interface Props {
    onModalClose: () => void;
    diseaseName: string;
}

export default function EditCaseBundle(props: Props): JSX.Element {
    const { id } = useParams();
    const [c, setCase] = useState<Day0Case>();
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>();

    useEffect(() => {
        setLoading(true);
        axios
            .get<Day0Case[]>(`/api/cases/bundled/${id}`)
            .then((resp) => {
                setCase(resp.data[0]);
                setErrorMessage(undefined);
            })
            .catch((e) => {
                setCase(undefined);
                setErrorMessage(e.response?.data?.message || e.toString());
            })
            .finally(() => setLoading(false));
    }, [id]);

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
                    bundleId={id}
                    initialCase={c}
                    onModalClose={props.onModalClose}
                    diseaseName={props.diseaseName}
                />
            )}
        </div>
    );
}
