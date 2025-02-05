import { Router } from 'express';
import { fetchMessages, fetchAllMessages } from '../services/messageServices.js';
var router = Router();

router.get('/fetch/:userId/:reciptentId/:groupId', async function (req, res, next) {
    try {
        if (!req.params.userId || !req.params.reciptentId) {
            throw new Error("Mandatory fields missing");
        }

        let response = await fetchMessages(req.params.userId, req.params.reciptentId, req.params.groupId === "undefined" ? null : req.params.groupId);
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.name, message: error.message });
    }
})

router.get('/:userId', async function (req, res, next) {
    try {
        if (!req.params.userId) {
            throw new Error("Mandatory fields missing");
        }

        let response = await fetchAllMessages(req.params.userId);
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.name, message: error.message });
    }
})

export default router;