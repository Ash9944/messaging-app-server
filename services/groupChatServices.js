import dao from '../dao/groupChatDao.js';
import messageDao from '../dao/messagesDao.js';
import { v4 as uuidv4 } from 'uuid';

async function create(data) {
    try {
        let group = {
            "name": data.groupName,
            "groupId": uuidv4(),
            "members": [...new Set(data.members)],
            "admin": [data.createdBy],
            "createdBy": data.createdBy
        };

        group.members.push(data.createdBy);
        if(group.members.length < 2){
            throw new Error("Group members cannot be less than 2");
        }

        await dao.create(group);

        return Promise.resolve(group);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function fetchSingleGroup(groupId) {
    try {
        let group = await dao.getOne({ groupId: groupId });
        if (!group) {
            throw new Error("Group not found");
        }

        return Promise.resolve(group);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function deletegroup(groupId) {
    try {
        let group = await dao.getOne({ groupId: groupId });
        if (!group) {
            throw new Error("Group not found");
        }

        await dao.removeBy({ groupId: groupId });
        await messageDao.removeBy({ groupId: groupId });
        return Promise.resolve(true);
    }
    catch (error) {
        return Promise.reject(error);
    }
}

async function updateGroup(groupId, groupsData) {
    try {
        let group = await dao.getOne({ groupId: groupId });
        if (!group) {
            throw new Error("Group not found");
        }

        let deletedMembers = group.members.filter(data => !groupsData.members.includes(data));
        let response = await dao.updateOne({ groupId: groupId }, "SET", groupsData);
        await messageDao.removeBy({"from" : {"$in" : deletedMembers} , groupId : groupId});
        return Promise.resolve(response);
    }
    catch (error) {
        return Promise.reject(error);
    }
}

export {
    create,
    fetchSingleGroup,
    deletegroup,
    updateGroup
}