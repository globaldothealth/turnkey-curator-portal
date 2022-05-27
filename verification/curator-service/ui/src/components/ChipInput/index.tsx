import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

interface ChipInputProps {
    label: string;
    placeholder: string;
    values: string[];
    defaultValue?: string[];
    onChange: (values: string[]) => void;
    options?: string[];
    helperText?: string;
    dataTestId?: string;
}

const ChipInput = ({
    dataTestId,
    label,
    placeholder,
    values,
    defaultValue,
    onChange,
    options,
    helperText,
}: ChipInputProps) => {
    return (
        <Autocomplete
            data-testid={dataTestId}
            multiple
            options={options || []}
            value={values}
            defaultValue={defaultValue}
            freeSolo
            onChange={(_, values) => onChange(values)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    helperText={helperText || ''}
                />
            )}
        />
    );
};

export default ChipInput;
