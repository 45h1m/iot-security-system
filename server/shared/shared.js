const WebSocket = require("ws");
const mqtt = require("mqtt");

const options = {
    host: process.env.MQTT_HOST || "",
    port: process.env.MQTT_PORT || 8883,
    protocol: "mqtts",
    username: process.env.MQTT_USERNAME || "",
    password: process.env.MQTT_PASSWORD || "",
};

console.log("Trying to connect to MQTT broker");
console.log(options);

const wss = new WebSocket.Server({ noServer: true });
const mqttClient = mqtt.connect(options);

let clients = new Set();

module.exports = {clients, wss, WebSocket, mqttClient};