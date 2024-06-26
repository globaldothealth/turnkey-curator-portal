import { useTableStyles } from './styled';

export interface Data {
    _id: string;
    license: string;
    providerName: string;
    dataSource: string;
}

export interface HeadCell {
    disablePadding: boolean;
    id: keyof Data;
    label: string;
    numeric: boolean;
}

export type Order = 'asc' | 'desc';

export interface EnhancedTableProps {
    classes?: Partial<
        Record<
            'headerRow' | 'headerCell' | 'activeCellLabel' | 'visuallyHidden',
            string
        >
    >;
    numSelected: number;
    onRequestSort: (
        event: React.MouseEvent<unknown>,
        property: keyof Data,
    ) => void;
    order: Order;
    orderBy: string;
    rowCount: number;
}

// export enum OrderBy = {
//     Country = 'country'
// }
