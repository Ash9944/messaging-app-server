import NodeCache from "node-cache";
const tempCache = new NodeCache();
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require(`../config/config.${process.env.NODE_ENV}.json`);
const cacheExipryTime = config.cacheExipryTime;

function set(userId, cacheObject, expiryTime) {
    tempCache.set(userId, cacheObject, expiryTime);
    return;
}

function setSocketId(userId, socketId) {
    try {
        var cacheObject = tempCache.get(userId);
        // if (!cacheObject) {
        //     throw new Error("Please Login");
        // }

        cacheObject.socketId = socketId;
        tempCache.set(userId, cacheObject);
    } catch (error) {
        throw new Error(error);
    }
}

function get(userId) {
    return tempCache.get(userId);
}

function del(userId) {
    tempCache.del(userId);
    return;
}

export {
    set,
    get,
    del,
    setSocketId
}