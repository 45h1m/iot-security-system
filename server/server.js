const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mqtt = require("mqtt");
require("dotenv").config();
const { initStorage } = require("./controllers/storage");
const WebSocket = require("./shared/shared");

const APIRouter = require("./routes/apiRouter");
const { mqttHandler } = require("./controllers/mqttHandler");

const app = express();
const port = process.env.PORT || 80;

const {clients, wss}=require('./shared/shared')

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create WebSocket server

// WebSocket connection handling
wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("New client connected");

    ws.on("close", () => {
        clients.delete(ws);
        console.log("Client disconnected");
    });

    ws.on("message", function message(data) {
        console.log("received: %s", data);
    });
});

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

app.use("/api", APIRouter);

// Routes
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Express.js API!" });
});

app.get("/api/items/:id", (req, res) => {
    res.json({
        message: "Item retrieved",
        id: req.params.id,
    });
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

initStorage();

// Integrate WebSocket server with HTTP server
server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});