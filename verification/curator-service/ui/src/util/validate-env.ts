import { cleanEnv, str } from 'envalid';

export default function validateEnv(): Readonly<{
    REACT_APP_DISEASE_NAME: string;
    SERVICE_ENV: string;
}> & {
    readonly [varName: string]: string | boolean | number | undefined;
    // eslint-disable-next-line indent
} {
    return cleanEnv(process.env, {
        REACT_APP_DISEASE_NAME: str({
            desc: 'Name of the disease that should be displayed in Curator UI',
            devDefault: 'COVID-19',
        }),
        SERVICE_ENV: str({
            choices: ['local', 'locale2e', 'dev', 'qa', 'prod'],
            desc: 'Environment in which the service is running',
            devDefault: 'local',
        }),
    });
}
