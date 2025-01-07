import S3 from 'aws-sdk/clients/s3';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import session, { SessionOptions } from 'express-session';
import expressWinston from 'express-winston';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { NextFunction, Request, Response } from 'express';
import { middleware as OpenApiValidatorMiddleware } from 'express-openapi-validator';
import { ValidationError } from 'express-openapi-validator/dist/framework/types';
import winston from 'winston';

import AwsBatchClient from './clients/aws-batch-client';
import AwsLambdaClient from './clients/aws-lambda-client';
import EmailClient from './clients/email-client';
import CasesController from './controllers/cases';
import GeocodeProxy from './controllers/geocode';
import SourcesController from './controllers/sources';
import UploadsController from './controllers/uploads';
import * as usersController from './controllers/users';
import db, { connectToDatabase } from './model/database';
import validateEnv from './util/validate-env';
import {
    AuthController,
    authenticateByAPIKey,
    mustBeAuthenticated,
    mustHaveAnyRole,
} from './controllers/auth';
import { Role } from './model/user';
import { logger } from './util/logger';

async function makeApp() {
    const app = express();
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

    app.use(express.json({ limit: '50mb', type: 'application/json' }));
    app.use(
        express.urlencoded({
            limit: '50mb',
            extended: true,
        }),
    );

    dotenv.config();
    const env = validateEnv();

    const deployment_envs = ['dev', 'qa', 'prod'];
    if (!deployment_envs.includes(env.SERVICE_ENV)) {
        require('longjohn');
    }

    // Express configuration.
    app.set('port', env.PORT);

    // Connect to MongoDB.
    // MONGO_URL is provided by the in memory version of jest-mongodb.
    // DB_CONNECTION_STRING is what we use in prod.
    const mongoURL = process.env.MONGO_URL || env.DB_CONNECTION_STRING;
    const mongoClient = await connectToDatabase(mongoURL);

    // Store session info in MongoDB.
    // Configure authentication.
    app.use(cookieParser());
    const sess: SessionOptions = {
        secret: env.SESSION_COOKIE_KEY,
        // MongoStore implements touch() so we don't need resave.
        // Cf. https://github.com/expressjs/session#resave.
        resave: false,
        // Chosing false is useful for login sessions which is what we want.
        // https://github.com/expressjs/session#saveuninitialized
        saveUninitialized: false,
        store: MongoStore.create({
            client: mongoClient,
        }),
        cookie: {
            sameSite: 'strict',
        },
    };
    if (process.env.NODE_ENV === 'production') {
        if (sess.cookie) {
            app.set('trust proxy', 1); // trust first proxy
            sess.cookie.secure = true;
        }
    }
    app.use(session(sess));

    const awsBatchClient = new AwsBatchClient(
        env.SERVICE_ENV,
        env.LOCALSTACK_URL,
        env.JOB_QUEUE_ARN,
        env.AWS_SERVICE_REGION,
    );
    // Configure connection to AWS services.
    const awsLambdaClient = new AwsLambdaClient(
        env.SERVICE_ENV,
        env.LOCALSTACK_URL,
        env.AWS_SERVICE_REGION,
    );

    let s3Client;
    if (env.SERVICE_ENV == 'locale2e') {
        s3Client = new S3({
            region: env.AWS_SERVICE_REGION,
            endpoint: env.LOCALSTACK_URL,
            s3ForcePathStyle: true,
        });
    } else {
        s3Client = new S3({
            region: env.AWS_SERVICE_REGION,
            signatureVersion: 'v4',
        });
    }

    // Configure Email Client
    const emailClient = new EmailClient(
        env.SERVICE_ENV,
        env.AWS_ACCESS_KEY_ID,
        env.AWS_SECRET_ACCESS_KEY,
        env.AWS_SERVICE_REGION,
        env.EMAIL_USER_ADDRESS,
    ).initialize();

    // Configure auth controller
    const authController = new AuthController(
        env.SERVICE_ENV,
        env.AFTER_LOGIN_REDIRECT_URL,
        env.DISEASE_NAME,
        awsLambdaClient,
        emailClient,
    );
    authController.configurePassport(
        env.GOOGLE_OAUTH_CLIENT_ID,
        env.GOOGLE_OAUTH_CLIENT_SECRET,
    );

    if (env.ENABLE_LOCAL_AUTH) {
        authController.configureLocalAuth();
    }
    app.use(passport.initialize());
    app.use(passport.session());
    app.use('/auth', authController.router);

    // API validation.
    app.use(
        OpenApiValidatorMiddleware({
            apiSpec: './openapi/openapi.yaml',
            validateResponses: true,
        }),
    );

    // Configure curator API routes.
    const apiRouter = express.Router();

    // Configure sources controller.
    const sourcesController = new SourcesController(
        emailClient,
        awsBatchClient,
        env.DATASERVER_URL,
    );
    apiRouter.get(
        '/sources',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator', Role.JuniorCurator]),
        sourcesController.list,
    );
    apiRouter.get(
        '/acknowledgment-sources',
        sourcesController.listSourcesForTable,
    );
    apiRouter.get(
        '/sources/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        sourcesController.get,
    );
    apiRouter.post(
        '/sources',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        sourcesController.create,
    );
    apiRouter.put(
        '/sources/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        sourcesController.update,
    );
    apiRouter.delete(
        '/sources/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        sourcesController.del,
    );
    apiRouter.post(
        '/sources/:id([a-z0-9]{24})/retrieve',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        sourcesController.retrieve,
    );
    apiRouter.get(
        '/sources/parsers',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        sourcesController.listParsers,
    );

    // Configure uploads controller.
    const uploadsController = new UploadsController(emailClient);
    apiRouter.get(
        '/sources/uploads',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        uploadsController.list,
    );
    apiRouter.post(
        '/sources/:sourceId([a-z0-9]{24})/uploads',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        uploadsController.create,
    );
    apiRouter.put(
        '/sources/:sourceId([a-z0-9]{24})/uploads/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        uploadsController.update,
    );

    // Configure cases controller proxying to data service.
    const casesController = new CasesController(
        env.DATASERVER_URL,
        env.COMPLETE_DATA_BUCKET,
        env.COUNTRY_DATA_BUCKET,
        s3Client,
    );
    apiRouter.get(
        '/cases',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.list,
    );
    apiRouter.get(
        '/cases/bundled',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.listBundled,
    );
    apiRouter.get(
        '/cases/countryData',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.listCasesByCountries,
    );
    apiRouter.get(
        '/cases/symptoms',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.listSymptoms,
    );
    apiRouter.get(
        '/cases/placesOfTransmission',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.listPlacesOfTransmission,
    );
    apiRouter.get(
        '/cases/occupations',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.listOccupations,
    );
    apiRouter.get(
        '/cases/locationComments',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.listLocationComments,
    );
    apiRouter.get(
        '/cases/:id(\\d+$)',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.get,
    );
    apiRouter.get(
        '/cases/bundled/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.getBundled,
    );
    apiRouter.put(
        '/cases/bundled/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.updateBundled,
    );
    apiRouter.post(
        '/cases/getDownloadLink',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.getDownloadLink,
    );
    apiRouter.post(
        '/cases',
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.create,
    );
    apiRouter.post(
        '/cases/verify/bundled',
        mustHaveAnyRole([Role.Curator]),
        casesController.verifyBundled,
    );
    apiRouter.post(
        '/cases/verify/:id(\\d+$)',
        mustHaveAnyRole([Role.Curator]),
        casesController.verify,
    );
    apiRouter.post(
        '/cases/download',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.download,
    );
    apiRouter.post(
        '/cases/downloadAsync',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.downloadAsync,
    );
    apiRouter.post(
        '/cases/batchUpsert',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.batchUpsert,
    );
    apiRouter.put(
        '/cases',
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.upsert,
    );
    apiRouter.post(
        '/cases/batchUpdate',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.batchUpdate,
    );
    apiRouter.post(
        '/cases/batchUpdateQuery',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.batchUpdateQuery,
    );
    apiRouter.post(
        '/cases/batchStatusChange',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.batchStatusChange,
    );
    apiRouter.put(
        '/cases/:id(\\d+$)',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        casesController.update,
    );
    apiRouter.delete(
        '/cases',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.Admin]),
        casesController.batchDel,
    );
    apiRouter.delete(
        '/cases/:id(\\d+$)',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator]),
        casesController.del,
    );
    apiRouter.delete(
        '/cases/bundled',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator]),
        casesController.batchDelBundled,
    );
    apiRouter.delete(
        '/cases/bundled/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator]),
        casesController.delBundled,
    );
    // Configure users controller.
    apiRouter.get(
        '/users',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Admin]),
        usersController.list,
    );
    apiRouter.put(
        '/users/:id',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Admin]),
        usersController.updateRoles,
    );
    apiRouter.delete(
        '/users/:id',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Admin]),
        usersController.deleteUser,
    );
    apiRouter.get(
        '/users/roles',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Admin]),
        usersController.listRoles,
    );

    const geocodeProxy = new GeocodeProxy(env.LOCATION_SERVICE_URL);

    // Forward geocode requests to location service.
    apiRouter.get(
        '/geocode/suggest',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        geocodeProxy.suggest,
    );
    apiRouter.get(
        '/geocode/convertUTM',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        geocodeProxy.convertUTM,
    );
    apiRouter.get(
        '/geocode/countryNames',
        authenticateByAPIKey,
        mustBeAuthenticated,
        geocodeProxy.countryNames,
    );
    apiRouter.post('/geocode/seed', geocodeProxy.seed);
    apiRouter.post('/geocode/clear', geocodeProxy.clear);
    apiRouter.get(
        '/geocode/admin1',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        geocodeProxy.admin1,
    );
    apiRouter.get(
        '/geocode/admin2',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        geocodeProxy.admin2,
    );
    apiRouter.get(
        '/geocode/admin3',
        authenticateByAPIKey,
        mustHaveAnyRole([Role.Curator, Role.JuniorCurator]),
        geocodeProxy.admin3,
    );

    // Forward excluded case IDs fetching to data service
    apiRouter.get('/excludedCaseIds', casesController.listExcludedCaseIds);

    app.use('/api', apiRouter);

    //Send feedback from user to global.health email
    app.post(
        '/feedback',
        mustBeAuthenticated,
        async (req: Request, res: Response) => {
            const { message } = req.body;

            try {
                await emailClient.send(
                    [env.EMAIL_USER_ADDRESS],
                    'Feedback regarding Covid-19 curator portal',
                    message,
                );
                return res
                    .status(200)
                    .json({ message: 'Email sent successfully' });
            } catch (err) {
                const error = err as Error;
                logger.error(error);
                return res.status(500).json({
                    message:
                        'Unfortunately, an error occurred. Please, try again later.',
                });
            }
        },
    );

    // Basic health check handler.
    app.get('/health', async (req: Request, res: Response) => {
        try {
            await db().command({ ping: 1 });
            res.sendStatus(200);
        } catch (err) {
            const error = err as Error;
            logger.error('error pinging db for health check');
            logger.error(error);
            // Unavailable, this is wrong as per HTTP RFC, 503 would mean that we
            // couldn't determine if the backend was healthy or not but honestly
            // this is simple enough that it makes sense.
            return res.sendStatus(503);
        }
    });

    // version handler.
    app.get('/version', cors(), (req: Request, res: Response) => {
        res.status(200).send(env.CURATOR_VERSION);
    });

    app.get('/diseaseName', (req: Request, res: Response) => {
        res.status(200).send(env.DISEASE_NAME);
    });

    // get current environment
    app.get('/env', (req: Request, res: Response) => {
        res.status(200).send(env.SERVICE_ENV);
    });

    // API documentation.
    const swaggerDocument = YAML.load('./openapi/openapi.yaml');
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

    // Register error handler to format express validator errors otherwise
    // a complete HTML document is sent as the error output.
    app.use(
        (
            err: ValidationError,
            req: Request,
            res: Response,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            next: NextFunction,
        ) => {
            res.status(err.status || 500).json({
                message: err.message,
                errors: err.errors,
            });
        },
    );

    // Serve static UI content if static directory was specified.
    if (env.STATIC_DIR) {
        logger.info('Serving static files from', env.STATIC_DIR);
        app.use(express.static(env.STATIC_DIR));
        // Send index to any unmatched route.
        // This must be the LAST handler installed on the app.
        // All subsequent handlers will be ignored.
        app.get('*', (req: Request, res: Response) => {
            res.sendFile(path.join(env.STATIC_DIR, 'index.html'));
        });
    }

    // report errors in the pipeline - this has to come after all other middleware and routers
    app.use(
        expressWinston.errorLogger({
            transports: [new winston.transports.Console()],
            format: winston.format.json(),
        }),
    );

    return app;
}

export default makeApp;
