import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.tsx";

const websocketURL = `wss://${window.location.host}:443` || `wss://${window.location.hostname}:443`;
// const websocketURL = `wss://localhost:80`;

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <WebSocketProvider url={websocketURL}>
            <App />
        </WebSocketProvider>
    </StrictMode>
);
