import { Router } from 'express';
import { create , login , fetchUsers } from '../services/userServices.js';
var router = Router();

router.post('/register', async function (req, res, next) {
    try {
        if(!req.body){
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
        if(!req.body){
            throw new Error("Mandatory fields missing");
        }

        let response = await login(req.body);
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.name, message: error.message });
    }
})

router.get('/:userId/:isFriends', async function (req, res, next) {
    try {
        if(!req.params.userId){
            throw new Error("Mandatory fields missing");
        }

        let response = await fetchUsers(req.params.userId , req.params.isFriends);
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.name, message: error.message });
    }
})

export default router;