const { data } = require("node-persist");
const { getZones, updateZone, getTriggers, getLogs, resolveTrigger, setSystemState } = require("./storage");
const { clients, WebSocket, mqttClient } = require("../shared/shared");

async function handleGetZones(req, res) {
    try {
        const zones = await getZones();

        if (zones) {
            return res.status(200).json({
                success: true,
                data: zones,
            });
        }
    } catch (error) {
        console.log("Error getting zones:" + error);
    }

    return res.status(500).json({
        success: false,
        message: "Error getting zones.",
    });
}

async function handleUpdateZone(req, res) {
    const { id, name, color, enabled, description } = req.body;

    try {
        if (id === undefined || name === undefined || description === undefined || color === undefined || enabled === undefined) {
            return res.status(400).json({
                success: false,
                error: "Missing fields",
                message: "All fields (id, name, color, description, enabled) are required.",
            });
        }

        const response = await updateZone({
            id,
            name,
            color,
            enabled,
            description,
        });

        if (response) {
            return res.status(200).json({
                success: true,
                message: `Zone updated: ${id}`,
                data: response,
            });
        }
    } catch (error) {
        console.log("Error at handleUpdateZone: " + error);
    }

    return res.status(400).json({
        success: false,
        message: "Error updating zone.",
    });
}

async function handleGetTriggers(req, res) {
    try {
        const triggers = getTriggers();
        return res.status(200).json({
            success: true,
            data: triggers,
        });
    } catch (error) {
        console.log("error getting triggers: " + error);
    }
    return res.status(400).json({
        success: false,
        error: "failed getting triggers.",
    });
}

async function handleResolveTrigger(req, res) {
    const { id, remarks } = req.body;
    if (!id || !remarks)
        return res.status(400).json({
            success: false,
            error: "All fields (id, remarks) are required.",
        });

    const resolved = await resolveTrigger({ id, remarks });
    if (resolved){

        const triggerExist = getTriggers().some((trigger)=> trigger.resolved === false);
        

        if(!triggerExist) {


            mqttClient.publish("cooldown", JSON.stringify({ data: "cooldown" }), (err) => {
                if (err) {
                    console.log("Error publishing message while cooling down: " + err);
                }
            });
        }
        
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ newLog:{data: "triggerResolved"} }));
            }
        });

        

        return res.status(200).json({
            success: true,
            message: "Trigger resolved.",
            data: resolved,
        });
        
    }
    return res.status(400).json({
        success: false,
        error: "failed to resolve trigger.",
    });
}

function handleGetLogs(req, res) {
    const logs = getLogs();
    if (!logs)
        return res.status(404).json({
            success: false,
            error: "No logs found.",
        });

    return res.status(200).json({
        success: true,
        data: logs,
    });
}

async function handleArmDisarm(req, res) {
    const { state } = req.body;
    if (!state)
        return res.status(400).json({
            success: false,
            error: "All fields (state) are required.",
        });

    const currentState = await setSystemState(req.body.state);
    if(currentState) {

        

        mqttClient.publish("arm-disarm", JSON.stringify({ state: currentState }), (err)=>{
            if (err) {
                console.log("Error publishing message while changing state: " + err);
            }
        });

        return res.status(200).json({
            success: true,
            message: "System state set to: " + currentState,
            data: currentState,
        });
    }
}

module.exports = { handleGetZones, handleUpdateZone, handleGetTriggers, handleResolveTrigger, handleGetLogs, handleArmDisarm };
