import messageDao from '../dao/messagesDao.js';
import groupDao from '../dao/groupChatDao.js';
import userDao from '../dao/usersDao.js';
import { getS3SignedUrl, getSignedUrlForGetObject } from './s3.js';
import axios from 'axios';

async function saveMessage(userId, data) {
    try {
        let message = {
            "from": userId,
            "to": data.to,
            "on": new Date(),
            "message": data.input
        }

        data.groupId ? message.groupId = data.groupId : null;
        if (data.attachment) {
            let signedUrl = await getS3SignedUrl(userId, data.attachment);

            const options = {
                headers: {
                    contentType: data.attachment.fileType
                }
            };
            let file = base64ToArrayBuffer(data.attachment.file);
            await axios.put(signedUrl.signedUrl, file, options);
            message.attachment = {
                "filePath": signedUrl.filePath,
                "fileType": data.attachment.fileType,
                "fileName": data.attachment.fileName
            };
        }
        await messageDao.create(message);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function fetchMessages(fromId, toId, groupId) {
    try {
        let query = !groupId ? {
            "from": { "$in": [toId, fromId] },
            "to": { "$in": [fromId, toId] }
        } : { groupId: groupId };

        let messages = await messageDao.getBy(query);
        for (let i = 0; i < messages.length; i++) {
            var data = messages[i];
            if (data.attachment) {
                data.attachmentType =  data.attachment.fileType
                data.attachment = await getSignedUrlForGetObject({ url: data.attachment.filePath });
            }
        }

        return Promise.resolve(messages);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function fetchAllMessages(userId) {
    try {
        let isUser = await userDao.count({ "userId": userId });
        if (!isUser) {
            throw new Error("User not found");
        }
        var groups = await groupDao.getBy({ "members": userId });
        var groupNames = groups.map(group => group.name);
        let pipeline = [
            { "$match": { "groupId": { "$exists": false }, "$or": [{ "from": { "$in": [userId] } }, { "to": { "$in": [userId] } }] } },
            { "$sort": { "on": -1 } },
            {
                $group: {
                    _id: {
                        user1: { $min: ["$from", "$to"] },
                        user2: { $max: ["$from", "$to"] }
                    },
                    details: { $push: "$$ROOT" }
                }
            }
        ]
        let messages = await messageDao.aggregate(pipeline);

        var formattedData = [];
        for (let i = 0; i < messages.length; i++) {
            var data = {
                userId: messages[i]._id.user1 === userId ? messages[i]._id.user2 : messages[i]._id.user1,
                lastMessage: messages[i].details[0].message,
                on: messages[i].details[0].on
            }
            formattedData.push(data);
        }

        var groupMessages = await messageDao.aggregate([
            { "$match": { "to": { "$in": groupNames } } },
            { "$sort": { "on": -1 } },
            {
                $group: {
                    _id: "$to",
                    "groupId": { "$first": "$groupId" },
                    details: { $push: "$$ROOT" }
                }
            }
        ])

        for (let i = 0; i < groups.length; i++) {
            var groupMessage = groupMessages.find(x => x.groupId === groups[i].groupId);
            if (!groupMessage) {

                var data = {
                    userId: groups[i].name,
                    lastMessage: null,
                    on: null,
                    groupId: groups[i].groupId
                }

                formattedData.push(data);
                continue;
            }

            var data = {
                userId: groupMessage._id,
                lastMessage: `${groupMessage.details[0].from} : ${groupMessage.details[0].message}`,
                on: groupMessage.details[0].on,
                groupId: groups[i].groupId
            }

            formattedData.push(data);
        }

        return Promise.resolve(formattedData.sort((a, b) => new Date(b.on) - new Date(a.on)));
    } catch (error) {
        return Promise.reject(error);
    }
}

function base64ToArrayBuffer(base64) {

    const base64String = base64.split(',')[1] || base64;
    const binaryString = atob(base64String);
    const buffer = new ArrayBuffer(binaryString.length);
    const uintArray = new Uint8Array(buffer);
    for (let i = 0; i < binaryString.length; i++) {
        uintArray[i] = binaryString.charCodeAt(i);
    }

    return buffer;
}

export {
    saveMessage,
    fetchMessages,
    fetchAllMessages
}