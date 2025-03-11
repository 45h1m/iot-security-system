const { wss, clients } = require("../shared/shared");
const { mqttHandler } = require("./mqttHandler");
const { getSystemState } = require("./storage");

function webSocketHandler(ws) {
    clients.add(ws);
    console.log("New client connected");

    ws.on("close", () => {
        clients.delete(ws);
        console.log("Client disconnected");
    });

    ws.on("message", function message(data) {
        console.log("socket received: %s", data);

        try {
            data = JSON.parse(data.toString());
        } catch (error) {
            console.log("failed webSocketHandler, at onmessage: " + error);
            return;
        }

        if (!data || !data.topic) return;

        data.topic === "arm-disarm" && mqttHandler(data.topic, data.data);
    });

    ws.send(JSON.stringify({ systemState: getSystemState() }));
}

module.exports = { webSocketHandler };
