import { Router } from 'express';
import { create, login, fetchUsers } from '../services/userServices.js';
import { onRefresh, validateToken } from '../middleware/auth.js';
var router = Router();

router.post('/register', async function (req, res, next) {
    try {
        if (!req.body) {
            throw new Error("Mandatory fields missing");
        }

        let response = await create(req.body);
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.name, message: error.message });
    }
})

router.post('/login', async function (req, res, next) {
    try {
        if (!req.body) {
            throw new Error("Mandatory fields missing");
        }

        let response = await login(req.body);
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.name, message: error.message });
    }
})

router.get('/:userId/:isFriends', validateToken, async function (req, res, next) {
    try {
        if (!req.params.userId) {
            throw new Error("Mandatory fields missing");
        }

        let response = await fetchUsers(req.params.userId, req.params.isFriends);
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.name, message: error.message });
    }
})
router.put('/refresh/token/:userId', validateToken, async function (req, res) {
    try {
        let userId = req.params.userId;

        if (!userId) {
            throw new Error("Missing ID");
        }

        let jwtResponse = onRefresh(userId);

        let tokenDetails = {
            "email": email,
            "token": jwtResponse
        };
        res.send({ "tokenDetails": tokenDetails });

    } catch (err) {
        res.status(500).send({ error: err.name, message: err.message });
    }
});


export default router;