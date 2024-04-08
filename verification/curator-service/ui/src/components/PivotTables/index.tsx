import React, { useEffect } from 'react';
import MaterialTable, { MTableBody } from '@material-table/core';
import { Paper } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useSelector } from 'react-redux';

import { useAppDispatch } from '../../hooks/redux';
import {
    selectCasesByCountry,
    selectTotalCases,
} from '../../redux/pivotTables/selectors';
import { CasesByCountry } from '../../redux/pivotTables/slice';
import { fetchCasesByCountryPivotData } from '../../redux/pivotTables/thunk';

const pivotTableStyles = makeStyles()(() => ({
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
    const { classes } = pivotTableStyles();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchCasesByCountryPivotData());
    }, [dispatch]);

    const casesByCountryData = useSelector(selectCasesByCountry);
    const casesGloballyData = useSelector(selectTotalCases);

    const editableCasesByCountryData = casesByCountryData.map(
        (casesByCountry: CasesByCountry) => ({
            ...casesByCountry,
        }),
    );

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
                                            {casesGloballyData?.confirmed}
                                        </td>
                                        <td className={classes.cell}>
                                            {casesGloballyData?.suspected}
                                        </td>
                                        <td className={classes.cell}>
                                            {casesGloballyData?.death}
                                        </td>
                                        <td className={classes.cell}>
                                            {casesGloballyData?.total}
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
