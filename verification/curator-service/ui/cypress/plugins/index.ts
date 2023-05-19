// Need to use require in plugins file
// https://stackoverflow.com/questions/59743577/is-there-anyway-to-query-mongodb-in-cypress-test
const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017/';

module.exports = (on: any, config: any) => {
    // We need to set env for cypress here
    if (process.env.MONGO_DB_NAME) {
        // For github actions E2E_MONGO_DB_NAME is in envs
        config.env['E2E_MONGO_DB_NAME'] = process.env.MONGO_DB_NAME;
    }
    else {
        // Read E2E_MONGO_DB_NAME from .env file
        const envs = require('dotenv').config({ path: `${__dirname}/../../../../../dev/.env` })
        config.env['E2E_MONGO_DB_NAME'] = envs.parsed.MONGO_DB_NAME;
    }

    on('task', {
        clearCasesDB() {
            return new Promise((resolve, reject) => {
                MongoClient.connect(
                    url,
                    { useUnifiedTopology: true },
                    async (error, db) => {
                        if (error) reject(error);
                        const dbInstance = db.db(config.env['E2E_MONGO_DB_NAME']);
                        await dbInstance.collection('day0cases').deleteMany({});
                        db.close();
                        resolve(null);
                    },
                );
            });
        },
        clearSourcesDB() {
            return new Promise((resolve, reject) => {
                MongoClient.connect(
                    url,
                    { useUnifiedTopology: true },
                    async (error, db) => {
                        if (error) reject(error);
                        const dbInstance = db.db(config.env['E2E_MONGO_DB_NAME']);
                        await dbInstance.collection('sources').deleteMany({});
                        db.close();
                        resolve(null);
                    },
                );
            });
        },
        clearUsersDB() {
            return new Promise((resolve, reject) => {
                MongoClient.connect(
                    url,
                    { useUnifiedTopology: true },
                    async (error, db) => {
                        if (error) reject(error);
                        const dbInstance = db.db(config.env['E2E_MONGO_DB_NAME']);
                        await dbInstance.collection('users').deleteMany({});
                        await dbInstance.collection('sessions').deleteMany({});
                        db.close();
                        resolve(null);
                    },
                );
            });
        },
    });
    return config;
};
