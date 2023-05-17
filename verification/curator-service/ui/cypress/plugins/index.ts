// Need to use require in plugins file
// https://stackoverflow.com/questions/59743577/is-there-anyway-to-query-mongodb-in-cypress-test
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/';
const envs = require('dotenv').config({ path: `${__dirname}/../../../../../dev/.env` })

module.exports = (on: any, config: any) => {
    config.env['MONGO_INITDB_DATABASE'] = envs.parsed.MONGO_INITDB_DATABASE

    on('task', {
        clearCasesDB() {
            return new Promise((resolve, reject) => {
                MongoClient.connect(
                    url,
                    { useUnifiedTopology: true },
                    async (error, db) => {
                        if (error) reject(error);
                        const dbInstance = db.db(envs.parsed.MONGO_INITDB_DATABASE);
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
                        const dbInstance = db.db(envs.parsed.MONGO_INITDB_DATABASE);
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
                        const dbInstance = db.db(envs.parsed.MONGO_INITDB_DATABASE);
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
