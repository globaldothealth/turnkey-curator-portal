import { Paper } from '@mui/material';
import MaterialTable, { MTableBody, MTableHeader } from 'material-table';
import React, { useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useAppDispatch } from '../../hooks/redux';
import { fetchCasesByCountryPivotData } from '../../redux/pivotTables/thunk';
import {
    selectCasesByCountry,
    selectTotalCases,
} from '../../redux/pivotTables/selectors';
import { useSelector } from 'react-redux';

const pivotTableStyles = makeStyles(() => ({
    cell: {
        padding: '16px',
        fontWeight: 'bold',
        textAlign: 'right',
    },
    firstCell: {
        padding: '16px',
        fontWeight: 'bold',
    },
}));

const PivotTables = () => {
    const classes = pivotTableStyles();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchCasesByCountryPivotData());
    }, [dispatch]);

    const casesByCountryData = useSelector(selectCasesByCountry);
    const totalCasesData = useSelector(selectTotalCases);

    if (!casesByCountryData || casesByCountryData.length === 0) {
        return <div>Loading...</div>;
    }

    const editableCasesByCountryData = casesByCountryData.map((o: any) => ({
        ...o,
    }));

    return (
        <Paper>
            <MaterialTable
                options={{
                    search: true,
                    paging: false,
                }}
                columns={[
                    { title: 'Country', field: 'country', defaultSort: 'asc' },
                    {
                        title: 'Confirmed',
                        field: 'confirmed',
                        type: 'numeric',
                    },
                    {
                        title: 'Suspected',
                        field: 'suspected',
                        type: 'numeric',
                    },
                    {
                        title: 'Death',
                        field: 'death',
                        type: 'numeric',
                    },
                    {
                        title: 'Total',
                        field: 'total',
                        type: 'numeric',
                    },
                ]}
                data={editableCasesByCountryData}
                components={{
                    Body: (props) => {
                        return (
                            <>
                                <MTableBody {...props} />
                                <tfoot>
                                    <tr>
                                        <td className={classes.firstCell}>
                                            Grand Total
                                        </td>
                                        <td className={classes.cell}>
                                            {totalCasesData?.confirmed}
                                        </td>
                                        <td className={classes.cell}>
                                            {totalCasesData?.suspected}
                                        </td>
                                        <td className={classes.cell}>
                                            {totalCasesData?.death}
                                        </td>
                                        <td className={classes.cell}>
                                            {totalCasesData?.total}
                                        </td>
                                    </tr>
                                </tfoot>
                            </>
                        );
                    },
                }}
                title="Cases by Country"
            />
        </Paper>
    );
};

export default PivotTables;
