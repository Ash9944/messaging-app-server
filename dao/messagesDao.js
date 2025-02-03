import BaseDao from './base.js';
const collectionName = 'messages';
const dao = BaseDao(collectionName);

export default {
    ...dao
}