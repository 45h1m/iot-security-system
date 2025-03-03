import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.tsx";

const websocketURL = process.env.NODE_ENV || process.env.NODE_ENV === 'development'? 'ws://localhost:80' : `wss://${window.location.host}:443` || `wss://${window.location.hostname}:443`;

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <WebSocketProvider url={websocketURL}>
            <App />
        </WebSocketProvider>
    </StrictMode>
);
