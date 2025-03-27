import { useState, useEffect } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";

const ArmDisarm = () => {
    // Define the three possible states
    const states = ["DISARMED", "ARMED"];
    const [currentState, setCurrentState] = useState("DISARMED");
    const { sendMessage, lastMessage, isConnected } = useWebSocket();

    // Colors for each state
    const stateColors: any = {
        ARMED: "bg-red-600",
        DISARMED: "bg-green-600",
        "SEMI-ARMED": "bg-yellow-500",
    };

    // Gradient classes for each state
    const gradientColors: any = {
        ARMED: "from-red-600",
        DISARMED: "from-green-600",
        "SEMI-ARMED": "from-yellow-500",
    };

    // Function to update state based on lastMessage
    useEffect(() => {
        if (lastMessage) {
            let messageData = lastMessage;
            try {
                if (typeof lastMessage === "string") messageData = JSON.parse(lastMessage);
                if (messageData.systemState) {
                    const newState = messageData.systemState.toUpperCase();
                    if (states.includes(newState)) {
                        setCurrentState(newState);
                    }
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        }
    }, [lastMessage]);

    // Function to change state and send message to WebSocket
    const changeState = (state: string) => {
        setCurrentState(state);

        if (isConnected) {
            sendMessage(
                JSON.stringify({
                    topic: "arm-disarm",
                    data: {
                        state: state.toLowerCase(),
                    },
                })
            );
        }
    };

    // Button styles based on active state
    const getButtonStyle = (state: string) => {
        if (state === currentState) {
            return "text-white font-bold " + stateColors[state];
        }
        return "text-slate-300 hover:ring-2 hover:ring-slate-300";
    };

    return (
        <>
            {/* {lastMessage && <p>{lastMessage}</p>} */}
            <div
                className={`sticky top-23 z-20 w-full ${stateColors[currentState]} p-2 pb-3 flex items-center justify-center transition-colors duration-300`}
                style={{ clipPath: "polygon(50% 100%, 100% 60%, 100% 0, 0 0, 0 60%)" }}
            >
                <span className="font-bold text-white text-xl tracking-wider">{currentState}</span>
            </div>
        <div className={`mx-auto bg-gradient-to-b ${gradientColors[currentState]} to-transparent`}>

            <div className="flex justify-center space-x-4 pt-10 -mt-8">
                {states.map((state) => (
                    <button
                        key={state}
                        onClick={() => changeState(state)}
                        className={`cursor-pointer px-4 py-2 rounded-lg transition-colors ${getButtonStyle(state)}`}
                    >
                        {state}
                    </button>
                ))}
            </div>
        </div>
        </>
    );
};

export default ArmDisarm;
