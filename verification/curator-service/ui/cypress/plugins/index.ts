// Need to use require in plugins file
// https://stackoverflow.com/questions/59743577/is-there-anyway-to-query-mongodb-in-cypress-test
const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017/';
const databse = 'marburg'

module.exports = (on: any, config: any) => {
    console.log(process.env.MONGO_DB_NAME)
    // We need to set env for cypress here
    config.env['E2E_MONGO_DB_NAME'] = process.env.MONGO_DB_NAME || databse;

    on('task', {
        clearCasesDB() {
            return new Promise((resolve, reject) => {
                MongoClient.connect(
                    url,
                    { useUnifiedTopology: true },
                    async (error, db) => {
                        if (error) reject(error);
                        const dbInstance = db.db(databse);
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
                        const dbInstance = db.db(databse);
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
                        const dbInstance = db.db(databse);
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
