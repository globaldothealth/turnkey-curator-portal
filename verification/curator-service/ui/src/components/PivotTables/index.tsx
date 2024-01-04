import { Paper } from '@mui/material';
import MaterialTable, { MTableBody, MTableHeader } from 'material-table';
import React, { useEffect, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useAppDispatch } from '../../hooks/redux';
import { fetchCasesByCountryPivotData } from '../../redux/pivotTables/thunk';
import { selectCasesByCountry } from '../../redux/pivotTables/selectors';
import { useSelector } from 'react-redux';

const pivotTableStyles = makeStyles((theme) => ({
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

const mockedData = {
    countries: [
        {
            country: 'United States of America',
            confirmedCount: 1235,
            suspectedCount: 933,
            deathCount: 31,
            totalCount: 2199,
        },
        {
            country: 'France',
            confirmedCount: 46,
            suspectedCount: 34,
            deathCount: 0,
            totalCount: 80,
        },
        {
            country: 'Spain',
            confirmedCount: 76,
            suspectedCount: 23,
            deathCount: 1,
            totalCount: 100,
        },
        {
            country: 'Poland',
            confirmedCount: 56,
            suspectedCount: 34,
            deathCount: 2,
            totalCount: 92,
        },
        {
            country: 'Germany',
            confirmedCount: 234,
            suspectedCount: 140,
            deathCount: 0,
            totalCount: 374,
        },
        {
            country: 'United Kingdom',
            confirmedCount: 453,
            suspectedCount: 345,
            deathCount: 4,
            totalCount: 802,
        },
        {
            country: 'Portugal',
            confirmedCount: 32,
            suspectedCount: 12,
            deathCount: 2,
            totalCount: 46,
        },
    ],
    confirmedCount: 100,
    suspectedCount: 100,
    deathCount: 100,
    totalCount: 300,
};

const PivotTables = () => {
    const classes = pivotTableStyles();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchCasesByCountryPivotData());
    }, [dispatch]);

    const casesByCountryData = useSelector(selectCasesByCountry);

    const [columnCounts, setColumnCounts] = useState({
        summedConfirmedCount: mockedData.confirmedCount,
        summedSuspectedCount: mockedData.suspectedCount,
        summedDeathCount: mockedData.deathCount,
        summedTotalCount: mockedData.totalCount,
    });

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
                        field: 'totalCount',
                        type: 'numeric',
                    },
                ]}
                data={editableCasesByCountryData}
                components={{
                    Header: (props) => <MTableHeader {...props} />,
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
                                            {mockedData.confirmedCount}
                                        </td>
                                        <td className={classes.cell}>
                                            {mockedData.suspectedCount}
                                        </td>
                                        <td className={classes.cell}>
                                            {mockedData.deathCount}
                                        </td>
                                        <td className={classes.cell}>
                                            {mockedData.totalCount}
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
