const express = require('express');
const { handleGetZones, handleUpdateZone, handleGetTriggers, handleResolveTrigger, handleGetLogs } = require('../controllers/api');
const Router = express.Router();

function test(res, res) {

    return res.status(200).json({
        success: true,
        message: 'Welcome to the Express.js API!',
    })
}

Router.route('/zones')
.get(handleGetZones)
.post(handleUpdateZone)

Router.get('/triggers', handleGetTriggers);
Router.get('/logs', handleGetLogs);
Router.post('/resolveTrigger', handleResolveTrigger);

module.exports = Router;