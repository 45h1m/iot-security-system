import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.tsx";
import { AudioProvider } from "./contexts/AudioContext.tsx";

const wsURL = import.meta.env.VITE_WS_URL || "ws://localhost:80";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <WebSocketProvider url={wsURL}>
        <AudioProvider>

            <App />
        </AudioProvider>
        </WebSocketProvider>
    </StrictMode>
);
