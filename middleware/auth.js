import { v4 as uuidv4 } from 'uuid';
import { set, get, del } from '../middleware/nodeCache.js';
import jwt from 'jsonwebtoken';

function onLogin(userId) {
    try {
        let cacheObject = { "token" : uuidv4() + '#' + userId , "userId" : userId};
        set(userId, cacheObject, 15 * 60);
        let jwtPayload = { "userId": userId, stamp: new Date() };
        return jwt.sign(jwtPayload, cacheObject.token , { expiresIn: 15 * 60 });
    }
    catch (e) {
        throw e;
    }
}

function onRefresh(userId) {
    try {
        let privateKey = get(userId);
        if (privateKey) {
            set(userId, privateKey, 15 * 60);
            let jwtPayload = { "userId": userId, stamp: new Date() };
            return jwt.sign(jwtPayload, privateKey.token, { expiresIn: 15 * 60 });
        }
        else throw new Error("private key not available")
    }
    catch (e) {
        throw e;
    }
}

function onLogout(userId) {
    try {
        del(userId);
        return;
    }
    catch (e) {
        throw e;
    }
}

async function validateJwt(userId, token) {
    try {
        let currentEpoc = ((new Date().getTime() + 1) / 1000);
        let privateKey = get(userId);
        if (privateKey) {
            let { exp } = jwt.decode(token);
            if (currentEpoc < exp)
                return Promise.resolve(await _promisifyJwtVerify(token, privateKey.token));
            else {
                throw new Error("Token expired");
            }
        }
        else throw new Error("Session expired");
    }
    catch (e) {
        return Promise.reject(e);
    }
}

async function validateSocketToken(userId, token) {
    try {
        if (!userId || !token)
            throw new Error("Missing authorization fields");

        await validateJwt(userId, token);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function validateToken(req, res, next) {
    try {
        if (!req.headers.token || !req.headers.userId)
            throw new Error("Missing authorization fields");
        let userId = req.headers.userId;
        let token = req.headers.applicantauthorization;

        await validateJwt(userId, token);
        return updateReqHeader(req, res, next);
    } catch (e) {
        res.status(500).send({ error: e.name, message: e.message });
    }
}

export function updateReqHeader(req, res, next) {
    try {
        if (!req.headers.userDetails)
            req.headers.userDetails = {};
        if (req.headers['x-forwarded-for']) {
            req.headers.userDetails.ip = req.headers['x-forwarded-for'];
        } else if (req.connection && req.connection.remoteAddress)
            req.headers.userDetails.ip = req.connection.remoteAddress;
        else {
            req.headers.userDetails.ip = "";
        }
        return next();
    } catch (e) {
        res.status(500).send({ error: e.name, message: e.message });
    }
}

function _promisifyJwtVerify(token, privateKey) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, privateKey, (err, userDetails) => {
            if (!err) {
                resolve(userDetails);
            }
            else {
                reject(err);
            }
        });
    })
}

const _onLogin = onLogin;
export { _onLogin as onLogin };

const _onRefresh = onRefresh;
export { _onRefresh as onRefresh };

const _onLogout = onLogout;
export { _onLogout as onLogout };

const _validateToken = validateToken;
export { _validateToken as validateToken };

const _validateSocketToken = validateSocketToken;
export { _validateSocketToken as validateSocketToken };