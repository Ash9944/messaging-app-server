import dao from '../dao/messagesDao.js';

async function saveMessage(userId, data) {
    try {
        let message = {
            "from": userId,
            "to": data.to,
            "on": new Date(),
            "message": data.input
        }

        await dao.create(message);
    } catch (error) {

    }
}

async function fetchMessages(fromId, toId) {
    try {
        let messages = await dao.getBy({
            "from": { "$in": [toId, fromId] },
            "to": { "$in": [fromId, toId] }
        })

        return Promise.resolve(messages);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function fetchAllMessages(userId) {
    try {
        let pipeline = [
            { "$match": { "$or": [{ "from": { "$in": [userId] } }, { "to": { "$in": [userId] } }] } },
            { "$sort": { "from": -1 } } ,
            {"$group" : {
                "_id" : { },
                "details": { $push: "$$ROOT" }
            }}
        ]
        let messages = await dao.aggregate(pipeline)

        return Promise.resolve(messages);
    } catch (error) {
        return Promise.reject(error);
    }
}
export {
    saveMessage,
    fetchMessages,
    fetchAllMessages
}