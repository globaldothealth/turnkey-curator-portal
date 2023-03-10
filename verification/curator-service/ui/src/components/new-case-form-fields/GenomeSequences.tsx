import { FastField } from 'formik';

import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import Scroll from 'react-scroll';
import { TextField } from 'formik-mui';
import { useStyles } from './styled';
import clsx from 'clsx';

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Genomics metadata</strong> Which clade the viral strain
                belongs to.
            </li>
            <li>
                <strong>Accession number:</strong> Accession number of the
                sequence uploaded to public database, see{' '}
                <a
                    href="https://www.ncbi.nlm.nih.gov/genbank/sequenceids/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    here
                </a>{' '}
                for format details
            </li>
        </ul>
    </StyledTooltip>
);

export default function GenomeSequences(): JSX.Element {
    const globalClasses = useStyles();

    return (
        <Scroll.Element name="genomeSequences">
            <FieldTitle
                title="Genome Sequences"
                interactive
                tooltip={<TooltipText />}
            />
            <div
                className={clsx([
                    globalClasses.fieldRow,
                    globalClasses.halfWidth,
                ])}
            >
                <FastField
                    name="genomeSequences.genomicsMetadata"
                    type="text"
                    label="Genomics metadata"
                    component={TextField}
                    fullWidth
                />
            </div>
            <div
                className={clsx([
                    globalClasses.fieldRow,
                    globalClasses.halfWidth,
                ])}
            >
                <FastField
                    name="genomeSequences.accessionNumber"
                    type="text"
                    label="Accession number"
                    component={TextField}
                    fullWidth
                />
            </div>
        </Scroll.Element>
    );
}
