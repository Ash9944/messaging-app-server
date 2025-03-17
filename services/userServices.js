import dao from '../dao/usersDao.js'
import bcrypt from "bcrypt";
import { onLogin } from '../middleware/auth.js';
async function create(userDetails) {
    try {
        let isUserExists = await dao.count({ "userId": userDetails.userId });
        if (isUserExists) {
            throw new Error("User with this user ID already exists");
        }

        let user = {
            "userId": userDetails.userId,
            "email": userDetails.email,
            "password": await hashPassword(userDetails.password)
        }

        await dao.create(user);
        return Promise.resolve(user);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function login(userDetails) {
    try {
        let user = await dao.getOne({ "userId": userDetails.userId });
        if (!user) {
            throw new Error("No user found in user ID ! Please Register");
        }

        let isPasswordMatch = await bcrypt.compare(userDetails.password, user.password);
        if (!isPasswordMatch) {
            throw new Error("Passwords don't match");
        }

        let jwtResponse = onLogin(userDetails.userId);
        return Promise.resolve(jwtResponse);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function fetchUsers(userId, isFriends) {
    try {
        let user = await dao.getOne({ "userId": userId });
        if (!user) {
            throw new Error("No user found in user ID ! Please Register");
        }

        isFriends = isFriends === 'true' ? true : false;
        var friends = user.friends || [];
        var query = isFriends ? { "friends": { "$in": friends } } : { "friends": { "$nin": friends } };
        query.userId = { "$ne": userId };
        var friends = await dao.getBy(query, { "userId": 1 });

        return Promise.resolve(friends);
    } catch (error) {
        return Promise.reject(error);
    }
}

const hashPassword = async (password) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
};

export {
    create,
    login,
    fetchUsers
}