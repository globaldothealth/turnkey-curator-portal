import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectFilterBreadcrumbs } from '../../redux/app/selectors';
import { deleteFilterBreadcrumbs } from '../../redux/app/slice';
import { ChipData } from '../App';
import { setModalOpen, setActiveFilterInput } from '../../redux/filters/slice';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { FilterLabels } from '../../constants/types';

const FilterChips = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const filterBreadcrumbs = useAppSelector(selectFilterBreadcrumbs);

    const handleChipDelete = (breadcrumbToDelete: ChipData) => {
        const searchParams = new URLSearchParams(location.search);
        dispatch(deleteFilterBreadcrumbs(breadcrumbToDelete));
        searchParams.delete(breadcrumbToDelete.key);
        navigate({
            pathname: '/cases',
            search: searchParams.toString(),
        });
    };

    return (
        <Stack direction="row" spacing={1}>
            {filterBreadcrumbs.length > 0 && (
                <Chip
                    label="Filters"
                    color="primary"
                    onClick={() => dispatch(setModalOpen(true))}
                />
            )}
            {filterBreadcrumbs.map((breadcrumb) => (
                <Chip
                    key={breadcrumb.key}
                    label={`${
                        FilterLabels[breadcrumb.key] || breadcrumb.key
                    } - ${breadcrumb.value}`}
                    onDelete={() => handleChipDelete(breadcrumb)}
                    onClick={() => {
                        dispatch(setModalOpen(true));
                        dispatch(setActiveFilterInput(breadcrumb.key));
                    }}
                />
            ))}
        </Stack>
    );
};

export default FilterChips;
