import BaseDao from './base.js';
const collectionName = 'groupChats';
const dao = BaseDao(collectionName);

export default {
    ...dao
}