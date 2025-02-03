import BaseDao from './base.js';
const collectionName = 'users';
const dao = BaseDao(collectionName);

export default {
    ...dao
}