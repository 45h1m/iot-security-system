const { clients, WebSocket } = require("../shared/shared");
const { setZoneData, getZones, setZones, getTriggers, createTrigger, createLog } = require("./storage");
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
        const res = await createLog({ type: `${data.state}`, description: `Device ${data.state}.` });
        if (!res) {
            console.log("something went wrong while creating arm-disarm log.");
            return;
        }
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ newLog: data }));
            }
        });
    } catch (error) {
        console.log("failed handling arm-disarm: " + error);
    }
}
async function handleTrigger(data) {
    if (!data.zone) return;
    const triggers = getTriggers();
    if (triggers && triggers.length > 0) {
        const triggerExists = triggers.some((trigger, index) => trigger.zone === data.zone);
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

    try {
        data = JSON.parse(data.toString());
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
