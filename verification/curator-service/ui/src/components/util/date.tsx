import { parse } from 'date-fns';
import dayjs from "dayjs";

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
export function toUTCDate(dateString: Date | string | undefined | null): string | undefined {
    if (!dateString) return undefined;
    if (dateString instanceof Date) {
        return new Date(
            Date.UTC(dateString.getFullYear(), dateString.getMonth(), dateString.getDate()),
        ).toString();
    }

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
    dateString: Date | string | null | undefined,
): Date | null {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;

    // Parse date as local timezone to properly display it
    return dayjs(dateString.split('T')[0]).toDate()
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
