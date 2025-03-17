import { Router } from 'express';
import { create, fetchSingleGroup, deletegroup, updateGroup } from '../services/groupChatServices.js';
import { validateToken } from '../middleware/auth.js';
var router = Router();

router.post('/', validateToken, async function (req, res, next) {
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

router.get('/:groupId', validateToken, async function (req, res, next) {
    try {
        if (!req.params.groupId) {
            throw new Error("Mandatory fields missing");
        }

        let response = await fetchSingleGroup(req.params.groupId);
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.name, message: error.message });
    }
})

router.delete('/:groupId', validateToken, async function (req, res, next) {
    try {
        if (!req.params.groupId) {
            throw new Error("Mandatory fields missing");
        }

        let response = await deletegroup(req.params.groupId);
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.name, message: error.message });
    }
})


router.put('/:groupId', validateToken, async function (req, res, next) {
    try {
        if (!req.params.groupId || !req.body) {
            throw new Error("Mandatory fields missing");
        }

        let response = await updateGroup(req.params.groupId, req.body);
        res.send(response);
    } catch (error) {
        res.status(500).send({ error: error.name, message: error.message });
    }
})


export default router;