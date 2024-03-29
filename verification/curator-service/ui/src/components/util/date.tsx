import { parse } from 'date-fns';

export default function renderDate(
    date: string | Date | undefined | null,
): string {
    if (!date) return '';
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
        2,
        '0',
    )}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

// Changes the date to be in UTC while maintaining the current date values
export function toUTCDate(dateString: string | undefined): string | undefined {
    if (!dateString) return undefined;

    const date = new Date(dateString);
    // The datepicker sometimes returns the date at the
    // user's current time and timezone. We need to convert
    // it to a UTC date.
    // https://github.com/mui-org/material-ui-pickers/issues/1348
    const utcDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    return utcDate.toString();
}

export function toLocalDate(
    dateString: string | null | undefined,
): string | undefined {
    if (!dateString) return undefined;

    // Parse date as local timezone to properly display it
    const date = parse(dateString.slice(0, 10), 'yyyy-MM-dd', new Date());

    return date.toString();
}

export function renderDateRange(range?: {
    start?: string;
    end?: string;
}): string {
    if (!range || !range.start || !range.end) {
        return '';
    }
    return range.start === range.end
        ? renderDate(range.start)
        : `${renderDate(range.start)} - ${renderDate(range.end)}`;
}
