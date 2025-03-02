import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <WebSocketProvider url="ws://localhost:80">
            <App />
        </WebSocketProvider>
    </StrictMode>
);
