import React, { useEffect, useState } from "react";
import { useWebSocket } from "./contexts/WebSocketContext";
import Header from "./components/Header";
import axios from "axios";
import ZoneCard from "./components/ZoneCard";
import TriggerManagement from "./components/TriggerManagement";
import ArmDisarm from "./components/ArmDisarm";
import { CircleX, TableProperties } from "lucide-react";
const apiURL = import.meta.env.VITE_API_URL;

const App: React.FC = () => {
    // const [message, setMessage] = useState("");
    const [zones, setZones]: any = useState({});
    const { lastMessage, isConnected, connectionError } = useWebSocket();
    const [zoneShown, setZoneShown] = useState(false);

    useEffect(() => {
        getZones();
    }, [lastMessage, isConnected]);

    // const handleSend = () => {
    //     if (message.trim()) {
    //         sendMessage({ type: "chat", content: message });
    //         setMessage("");
    //     }
    // };

    async function getZones() {
        try {
            const res = await axios.get(`${apiURL || "http://localhost:80"}/api/zones`);
            if (res.data.success && res.data.data) {
                setZones(res.data.data);
                console.log(res.data.data);
            }
            if (res.data.error) {
                console.log(res.data.error);
            }
        } catch (error) {
            console.log("Error getting zones: " + error);
        }
    }

    const handleSaveZone = async (updatedZone: any, zoneKey: any) => {
        try {
            const res = await axios.post(`${apiURL || "http://localhost:80"}/api/zones`, { ...updatedZone, id: zoneKey });
            if (res.data.error) {
                console.log(res.data.error);
            }
            if (res.data.success) {
                getZones();
            }
        } catch (error) {
            console.log("Error saving zone: " + error);
        }
    };

    useEffect(() => {
        getZones();
    }, []);

    return (
        <div className="relative">
            <Header isConnected={isConnected} />
            {connectionError && !isConnected && (
                <p className="w-full text-center bg-red-800 font-semibold tracking-wide text-sm text-red-200">{connectionError}, reload.</p>
            )}
            {isConnected && <ArmDisarm />}

            <div className={`${!isConnected && "opacity-50 pointer-events-none"}`}>
                <div className="max-w-7xl mx-auto pl-4 mt-4">

                <button
                    className="flex gap-2 items-center text-sm mb-4 bg-slate-800 text-white px-2 py-2 rounded-md hover:bg-slate-700 cursor-pointer"
                    onClick={() => setZoneShown(true)}
                    >
                    <TableProperties />
                    Show Zones
                </button>
                    </div>
                <TriggerManagement />
                {zoneShown && (
                    <div className="fixed top-30 py-20 backdrop-blur-sm inset-0 overflow-y-auto">
                        {Object.keys(zones).length > 0 && (
                            <div>
                                <div className="max-w-5xl mx-auto px-4 mt-4 flex justify-between">
                                    <h2 className="text-2xl font-bold mb-4 text-white">Zones</h2>
                                    <button
                                        className="flex gap-2 items-center text-sm mb-4 bg-slate-800 text-white px-2 py-2 rounded-md hover:bg-slate-700 cursor-pointer"
                                        onClick={() => setZoneShown(false)}
                                    >
                                        <CircleX />
                                        Close
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 px-4 max-w-5xl mx-auto">
                                    {Object.keys(zones).map((zoneKey) => {
                                        if (zones[zoneKey].enabled)
                                            return (
                                                <ZoneCard
                                                    key={zoneKey}
                                                    zone={{...zones[zoneKey], id: zoneKey}}
                                                    onSave={(updatedZone: any) => handleSaveZone(updatedZone, zoneKey)}
                                                />
                                            );
                                        return null;
                                    })}
                                </div>
                                <h3 className="text-sm mb-4 text-white max-w-5xl mx-auto pl-4 mt-4">Disabled</h3>
                                <div className="flex flex-wrap gap-2 px-4 max-w-5xl mx-auto">
                                    {Object.keys(zones).map((zoneKey) => {
                                        if (!zones[zoneKey].enabled)
                                            return (
                                                <ZoneCard
                                                    key={zoneKey}
                                                    zone={{...zones[zoneKey], id: zoneKey}}
                                                    onSave={(updatedZone: any) => handleSaveZone(updatedZone, zoneKey)}
                                                />
                                            );
                                        return null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
