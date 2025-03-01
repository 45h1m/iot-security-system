const WebSocket = require("ws");

const wss = new WebSocket.Server({ noServer: true });

let clients = new Set();

module.exports = {clients, wss, WebSocket};