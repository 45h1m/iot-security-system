const { clients, WebSocket } = require("../shared/shared");
const { getZones, getTriggers, createTrigger, createLog, getSystemState, setSystemState } = require("./storage");
async function handleSensorData(data) {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ sensorData: data }));
        }
    });
}

async function handlePanic(data) {
    const res = await createTrigger({
        type: "panic",
        zone: "panic",
    });

    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ newLog: data }));
        }
    });

    if (!res) {
        console.log("something went wrong while creating panic trigger.");
        return;
    }
}
async function handleArmDisarm(data) {
    try {
        if(!data.state) return;

        const state = await setSystemState(data.state);

        if (!state) {
            console.log("something went wrong while setting system state. Data: "+ data);
            return;
        }

        const res = await createLog({ type: `${data.state}`, description: `Device ${data.state}.` });
        if (!res) {
            console.log("something went wrong while creating arm-disarm log.");
            return;
        }
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ 
                    newLog: data,
                    systemState: state,
                }));
            }
        });
    } catch (error) {
        console.log("failed handling arm-disarm: " + error);
    }
}
async function handleTrigger(data) {
    console.log(data)
    if (!data.zone) return;

    const systemState = getSystemState();

    console.log(systemState)

    if (systemState.toUpperCase() === "DISARMED") {
        console.log(`${data.zone} triggered but system is disarmed.`);
        return;
    }

    const triggers = getTriggers();

    if (triggers && triggers.length > 0) {
        const triggerExists = triggers.some((trigger, index) => trigger.zone === data.zone && trigger.resolved === false);
        if (triggerExists) {
            console.log("trigger already exists");
            return;
        }
    }

    const zones = await getZones();

    console.log(zones['zone0']);

    if (zones && zones[data.zone] && zones[data.zone].enabled) {
        console.log("creating trigger")
        const res = await createTrigger({
            type: "trigger",
            zone: data.zone,
        });
        if (!res) {
            console.log("Failed to createTrigger at handleTrigger");
        }
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ newLog: data }));
            }
        });
    }
}

async function mqttHandler(topic, data) {
    console.log(`Received MQTT message on topic ${topic}: ${data.toString()}`);
    console.log(typeof data)
    try {
        if(Buffer.isBuffer(data)) data = JSON.parse(data.toString());
        if(typeof data === "string") data = JSON.parse(data);
    } catch (error) {
        console.log("failed mqttHandler: " + error);
        return;
    }

    topic === "sensor-data" && handleSensorData(data);
    topic === "panic" && handlePanic(data);
    topic === "arm-disarm" && handleArmDisarm(data);
    topic === "trigger" && handleTrigger(data);
}

module.exports = { mqttHandler };
