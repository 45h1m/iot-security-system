const express = require('express');
const { handleGetZones, handleUpdateZone, handleGetTriggers, handleResolveTrigger, handleGetLogs, handleArmDisarm } = require('../controllers/api');
const Router = express.Router();

Router.route('/zones')
.get(handleGetZones)
.post(handleUpdateZone)

Router.get('/triggers', handleGetTriggers);
Router.get('/logs', handleGetLogs);
Router.post('/resolveTrigger', handleResolveTrigger);
module.exports = Router;