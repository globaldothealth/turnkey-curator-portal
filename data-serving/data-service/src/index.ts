import * as cases from './controllers/case';
import * as homeController from './controllers/home';

import { Request, Response } from 'express';
import {
    batchDeleteCheckThreshold,
    batchUpsertDropUnchangedCases,
    createBatchDeleteCaseRevisions,
    createBatchUpdateCaseRevisions,
    createBatchUpsertCaseRevisions,
    createCaseRevision,
    findCasesToUpdate,
    setBatchUpsertFields,
} from './controllers/preprocessor';

import { Day0Case } from './model/day0-case';
import { Geocoder } from './geocoding/geocoder';
import RemoteGeocoder from './geocoding/remoteGeocoder';
import { middleware as OpenApiValidatorMiddleware } from 'express-openapi-validator';
import YAML from 'yamljs';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express, { RequestHandler } from 'express';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import winston from 'winston';
import expressWinston from 'express-winston';
import validateEnv from './util/validate-env';
import { logger } from './util/logger';
import { IdCounter, COUNTER_DOCUMENT_ID } from './model/id-counter';

const app = express();

dotenv.config();
const env = validateEnv();

const deployment_envs = ['dev', 'qa', 'prod'];
if (!deployment_envs.includes(env.SERVICE_ENV)) {
    require('longjohn');
}

// Express configuration.
app.set('port', env.PORT);

// log all non-200 responses: this needs to come _before_ any middleware or routers
app.use(
    expressWinston.logger({
        transports: [new winston.transports.Console()],
        format: winston.format.json(),
        /* don't log user info. We don't get user cookies or passwords in this service, so it's just
         * belt-and-braces to ensure we don't log the API key if it was forwarded from the curator service.
         */
        headerBlacklist: ['X-Api-Key'],
    }),
);

app.use(bodyParser.json({ limit: '50mb' }) as RequestHandler);
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
    }) as RequestHandler,
);

// Configure app routes.
app.get('/', homeController.get);

// API documentation.
const swaggerDocument = YAML.load('./api/openapi.yaml');
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
        // Hide the useless "SWAGGER" black bar at the top.
        customCss: '.swagger-ui .topbar { display: none }',
        // Make it look nicer.
        customCssUrl:
            'https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.1/themes/3.x/theme-material.css',
    }),
);

// Basic health check handler.
app.get('/health', (req: Request, res: Response) => {
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting.
    // https://mongoosejs.com/docs/api.html#connection_Connection-readyState
    if (mongoose.connection.readyState == 1) {
        res.sendStatus(200);
        return;
    }
    // Unavailable, this is wrong as per HTTP RFC, 503 would mean that we
    // couldn't determine if the backend was healthy or not but honestly
    // this is simple enough that it makes sense.
    return res.sendStatus(503);
});

// API validation.
app.use(
    OpenApiValidatorMiddleware({
        apiSpec: './api/openapi.yaml',
        validateResponses: true,
    }),
);

const apiRouter = express.Router();
// Geocoders configured as an array so that alternate sources can be added.
const geocoders = new Array<Geocoder>();
const remoteGeocodingLocation = env.LOCATION_SERVICE_URL;
if (remoteGeocodingLocation) {
    logger.info(`Using remote geocoder at ${remoteGeocodingLocation}`);
    const remoteCoder = new RemoteGeocoder(remoteGeocodingLocation);
    geocoders.push(remoteCoder);
}

const caseController = new cases.CasesController(geocoders);

apiRouter.get('/cases', caseController.list);
apiRouter.get('/cases/countryData', caseController.countryData);
apiRouter.get('/cases/symptoms', cases.listSymptoms);
apiRouter.get('/cases/placesOfTransmission', cases.listPlacesOfTransmission);
apiRouter.get('/cases/occupations', cases.listOccupations);
apiRouter.get('/cases/locationComments', cases.listLocationComments);
apiRouter.post(
    '/cases/verify/:id(\\d+$)',
    createCaseRevision,
    caseController.verify,
);
apiRouter.get('/cases/:id(\\d+$)', caseController.get);
apiRouter.post('/cases', caseController.create);
apiRouter.post('/cases/download', caseController.download);
apiRouter.post(
    '/cases/batchUpsert',
    caseController.batchGeocode,
    batchUpsertDropUnchangedCases,
    setBatchUpsertFields,
    createBatchUpsertCaseRevisions,
    caseController.batchUpsert,
);
apiRouter.put('/cases', createCaseRevision, caseController.upsert);
apiRouter.post(
    '/cases/batchUpdate',
    createBatchUpdateCaseRevisions,
    caseController.batchUpdate,
);
apiRouter.post(
    '/cases/batchUpdateQuery',
    findCasesToUpdate,
    createBatchUpdateCaseRevisions,
    caseController.batchUpdate,
);
apiRouter.put('/cases/:id', createCaseRevision, caseController.update);
apiRouter.delete(
    '/cases',
    batchDeleteCheckThreshold,
    createBatchDeleteCaseRevisions,
    caseController.batchDel,
);
apiRouter.delete('/cases/:id(\\d+$)', createCaseRevision, caseController.del);

app.use('/api', apiRouter);

// report errors in the pipeline - this has to come after all other middleware and routers
app.use(
    expressWinston.errorLogger({
        transports: [new winston.transports.Console()],
        format: winston.format.json(),
    }),
);

(async (): Promise<void> => {
    // Connect to MongoDB.
    // MONGO_URL is provided by the in memory version of jest-mongodb.
    // DB_CONNECTION_STRING is what we use in prod.
    const mongoURL = process.env.DB_CONNECTION_STRING || process.env.MONGO_URL;

    if (mongoURL === undefined || mongoURL == '') {
        logger.error(
            'Failed to connect to the database. Neither "MONGO_URL" nor "DB_CONNECTION_STRING" environmental variables were provided.',
        );
        return process.exit(1);
    }

    logger.info(
        'Connecting to MongoDB instance',
        // Print only after username and password to not log them.
        mongoURL.substring(mongoURL.indexOf('@')),
    );

    try {
        await mongoose.connect(mongoURL);
    } catch (e) {
        logger.error(
            'Failed to connect to the database. Mongoose was unable to establish connection using provided mongoURL.',
        );
        if (e instanceof Error) logger.error(e);
        return process.exit(1);
    }

    try {
        await Day0Case.ensureIndexes();
    } catch (e) {
        logger.error(
            'Failed to connect to the database. Ensuring indexes of Day0Case model resulted in error.',
        );
        if (e instanceof Error) logger.error(e);
        return process.exit(1);
    }

    try {
        // check if there is a document holding unique ID counter
        // used to generate case IDs. If not, create one
        const idCounter = await IdCounter.findById(COUNTER_DOCUMENT_ID);
        if (!idCounter) {
            await IdCounter.create({
                _id: COUNTER_DOCUMENT_ID,
                count: 1,
                notes:
                    'Increment count using findAndModify to ensure that the count field will be incremented atomically with the fetch of this document',
            });
        }
    } catch (e) {
        logger.error(
            'Failed to connect to the database. Finding or initializing of IdCounter resulted in error.',
        );
        if (e instanceof Error) logger.error(e);
        return process.exit(1);
    }
})();

export default app;
