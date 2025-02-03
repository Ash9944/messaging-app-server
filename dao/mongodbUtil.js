import mongodb from 'mongodb';
import { ObjectId } from 'bson';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require(`../config/config.${process.env.NODE_ENV}.json`);

const mongoDBConfig = config.dbConfig;
const replica = mongoDBConfig.replica || "";
const options = {};
if (replica) {
    options.replicaSet = replica;
}

const mongoClient = new mongodb.MongoClient(mongoDBConfig.url, options);
let client;
//Cache the mongodb connection
const dbCache = {};

const connectPromise = async function () {
    try {
        client = await mongoClient.connect();
        dbCache.db = client.db(mongoDBConfig.db);
        console.log(`${new Date().toString()} : Connection with mongodb successful`);
        return Promise.resolve();
    }
    catch (e) {
        console.log(`${new Date().toString()} : Error while connecting to Mongo DB ${e}`);
        return Promise.reject(e);
    }

};

const getDb = function () {
    return dbCache.db;
};

export { connectPromise, getDb, ObjectId, client }