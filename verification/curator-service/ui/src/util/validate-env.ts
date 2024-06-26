import { cleanEnv, str } from 'envalid';

export default function validateEnv(): Readonly<{
    VITE_APP_MAP_LINK_LOCAL: string;
    VITE_APP_MAP_LINK_LOCAL_E2E: string;
    VITE_APP_MAP_LINK_DEV: string;
    VITE_APP_MAP_LINK_QA: string;
    VITE_APP_MAP_LINK_PROD: string;
    VITE_APP_DISEASE_NAME: string;
    SERVICE_ENV: string;
}> & {
    readonly [varName: string]: string | boolean | number | undefined;
    // eslint-disable-next-line indent
} {
    return cleanEnv(import.meta.env, {
        VITE_APP_MAP_LINK_LOCAL: str({
            desc: 'Map link for local environment',
            devDefault: 'http://dev-map.covid-19.global.health/',
        }),
        VITE_APP_MAP_LINK_LOCAL_E2E: str({
            desc: 'Map link for local e2e environment',
            devDefault: 'http://dev-map.covid-19.global.health/',
        }),
        VITE_APP_MAP_LINK_DEV: str({
            desc: 'Map link for development environment',
            devDefault: 'http://dev-map.covid-19.global.health/',
        }),
        VITE_APP_MAP_LINK_QA: str({
            desc: 'Map link for qa environment',
            devDefault: 'http://dev-map.covid-19.global.health',
        }),
        VITE_APP_MAP_LINK_PROD: str({
            desc: 'Map link for production environment',
            devDefault: 'https://map.covid-19.global.health/',
        }),
        VITE_APP_DISEASE_NAME: str({
            desc: 'Name of the disease that should be displayed in Curator UI',
            devDefault: 'COVID-19',
        }),
        SERVICE_ENV: str({
            choices: ['local', 'locale2e', 'dev', 'qa', 'prod'],
            desc: 'Environment in which the service is running',
            devDefault: 'local',
            default: 'prod',
        }),
    });
}
