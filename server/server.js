const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mqtt = require("mqtt");
require("dotenv").config();
const { initStorage } = require("./controllers/storage");
const WebSocket = require("./shared/shared");
const path = require("path");

const APIRouter = require("./routes/apiRouter");
const { mqttHandler } = require("./controllers/mqttHandler");

const app = express();
const port = process.env.PORT || 80;

const {clients, wss}=require('./shared/shared');
const { webSocketHandler } = require("./controllers/webSocketHandler");

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../client/dist')));


const options = {
    host: process.env.MQTT_HOST || "",
    port: process.env.MQTT_PORT || 8883,
    protocol: "mqtts",
    username: process.env.MQTT_USERNAME || "",
    password: process.env.MQTT_PASSWORD || "",
};

console.log("Trying to connect to MQTT broker");
console.log(options);
// Connect to MQTT broker
const mqttClient = mqtt.connect(options); // Update with your MQTT broker URL

mqttClient.on("connect", () => {
    console.log("Connected to MQTT broker");
    mqttClient.subscribe("#");
});
mqttClient.on("disconnect", () => {
    console.log("Disconnected from MQTT broker");
});

mqttClient.on("message", (topic, message) => {

    mqttHandler(topic, message);

    // Broadcast message to all connected WebSocket clients
    const broadcastMessage = {
        topic: topic,
        message: message.toString(),
        timestamp: new Date().toISOString(),
    };

    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(broadcastMessage));
        }
    });
});

wss.on("connection", webSocketHandler);

app.use("/api", APIRouter);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: "Something broke!",
        message: err.message,
    });
});

// Create HTTP server
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Integrate WebSocket server with HTTP server
server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});