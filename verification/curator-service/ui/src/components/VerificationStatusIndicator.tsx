import React from 'react';
import { Tooltip } from '@mui/material';

import UnverifiedIcon from './assets/unverified_icon.svg';
import VerifiedIcon from './assets/verified_icon.svg';
import ExcludedIcon from './assets/excluded_icon.svg';
import { VerificationStatus } from '../api/models/Case';
import renderDate from './util/date';

interface Props {
    status?: VerificationStatus;
    exclusionData?: {
        date: string;
        note: string;
    };
}

export default function VerificationStatusIndicator(props: Props): JSX.Element {
    let helpText;
    let iconElement;
    if (props.status === VerificationStatus.Verified) {
        helpText = 'Verified';
        iconElement = (
            <img
                src={VerifiedIcon}
                alt="Verified Icon"
                data-testid="verified-svg"
            />
        );
    } else if (props.status === VerificationStatus.Excluded) {
        if (props.exclusionData) {
            const { date, note } = props.exclusionData;
            helpText = `Excluded. Date: ${renderDate(date)}, Note: ${note}`;
        } else {
            helpText = 'Excluded';
        }

        iconElement = (
            <img
                src={ExcludedIcon}
                alt="Exclude Icon"
                data-testid="excluded-svg"
            />
        );
    } else {
        helpText = 'Unverified';
        iconElement = (
            <img
                src={UnverifiedIcon}
                alt="Unverified Icon"
                data-testid="unverified-svg"
            />
        );
    }

    return (
        <Tooltip title={helpText} placement="right">
            {iconElement}
        </Tooltip>
    );
}
