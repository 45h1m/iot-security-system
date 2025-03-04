import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.tsx";

const wsURL = import.meta.env.VITE_WS_URL || "ws://localhost:80";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <WebSocketProvider url={wsURL}>
            <App />
        </WebSocketProvider>
    </StrictMode>
);
