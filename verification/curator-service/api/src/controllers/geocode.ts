import { Request, Response } from 'express';

import axios, { AxiosError } from 'axios';
import mongoose from 'mongoose';

import { logger } from '../util/logger';

/**
 * Dumb proxy to geocoder in location service
 * For the most part, anyway: see countryNames
 */
export default class GeocodeProxy {
    constructor(private readonly locationServiceURL: string) {}

    suggest = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.locationServiceURL + req.url,
            );
            res.status(response.status).json(response.data);
            return;
        } catch (err) {
            logger.error(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    convertUTM = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.locationServiceURL + req.url,
            );
            res.status(response.status).json(response.data);
            return;
        } catch (err) {
            logger.error(err as Error);
            if (axios.isAxiosError(err)) {
                res.status(err.response!.status).send(err.response!.data);
                return;
            }
        }
    }

    /**
     * This is the only "meaty" method on this controller. It does proxy the
     * location service, but it also uses the database and two npm modules to
     * find out what ISO-3166-1 country codes are in use in the database and
     * what names are used for those countries.
     * @param req Express request
     * @param res Express response
     */
    countryNames = async (req: Request, res: Response): Promise<void> => {
        const mongoClient = mongoose.connection.getClient();
        const locationCountryCodes = await mongoClient.db().collection('cases').distinct('location.country');
        const travelHistoryCodes = await mongoClient.db().collection('cases').distinct('travelHistory.travel.location.country');
        const allCodes = Array.from(new Set(locationCountryCodes.concat(travelHistoryCodes)).values());
        res.status(200).json({'codes': allCodes});
    }

    seed = async (req: Request, res: Response): Promise<void> => {
        const response = await axios.post(
            this.locationServiceURL + req.url,
            req.body,
        );
        res.status(response.status).send();
    };

    clear = async (req: Request, res: Response): Promise<void> => {
        const response = await axios.post(
            this.locationServiceURL + req.url,
            req.body,
        );
        res.status(response.status).send();
    };
}
