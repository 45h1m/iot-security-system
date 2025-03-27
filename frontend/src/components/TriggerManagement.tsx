import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { changeTitleAndFavicon } from "../utils/changeTitleIcon";
import { useAudio } from "../contexts/AudioContext";

const apiURL = import.meta.env.VITE_API_URL || "http://localhost:80";

// Define TypeScript interfaces
interface Trigger {
    id: string;
    type: string;
    zone: string;
    resolved: boolean;
    remarks: string | null;
    triggerTime: number;
    resolveTime: number | null;
}

interface ResolveData {
    id: string;
    remarks: string;
}

const sound = new Audio();
sound.src = "/siren.mp3";
sound.loop = true;

const TriggerManagement: React.FC = () => {
    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);
    const [remarks, setRemarks] = useState<string>("");
    const [filter, setFilter] = useState<"all" | "resolved" | "unresolved">("all");

    const tableBody = useRef<HTMLTableSectionElement>(null);

    const { lastMessage, isConnected } = useWebSocket();

    const { playAudio, pauseAudio } = useAudio();

    useEffect(() => {
        if (lastMessage && lastMessage.newLog) {
            fetchTriggers();
        }
    }, [lastMessage, isConnected]);

    function scrollToLastRow() {
        if (tableBody.current) {
            const lastRow = tableBody.current.lastElementChild;
            lastRow?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }

    useEffect(() => {
        scrollToLastRow();
    }, [triggers]);

    const fetchTriggers = async () => {
        try {
            // Replace this with your actual method to get triggers
            const res = await axios.get(`${apiURL}/api/triggers`);
            if (!res.data.success) {
                console.log(res.data.error);
                return;
            }
            console.log(res.data.data);
            setTriggers(res.data.data);
            if (res.data.data.some((trigger: any) => !trigger.resolved)) {
                changeTitleAndFavicon("⚠ Triggered", "");
                setFilter("unresolved");
                playAudio("/siren.mp3");
                // if(navigator) vibrate()
            } else {
                setFilter("all");
                pauseAudio();
                changeTitleAndFavicon("✅ No Issues", "");
            }
        } catch (error) {
            console.error("Error fetching triggers:", error);
        } finally {
            setLoading(false);
        }
    };
    // Fetch triggers on component mount
    useEffect(() => {
        fetchTriggers();
    }, []);

    // Filter triggers based on selected filter
    const filteredTriggers = React.useMemo(() => {
        switch (filter) {
            case "resolved":
                return triggers.filter((trigger) => trigger.resolved);
            case "unresolved":
                return triggers.filter((trigger) => !trigger.resolved);
            default:
                return triggers;
        }
    }, [triggers, filter]);

    // Handle resolving a trigger
    const handleResolveTrigger = async () => {
        if (!selectedTriggerId || !remarks.trim()) {
            alert("Please select a trigger and provide remarks");
            return;
        }

        const resolveData: ResolveData = {
            id: selectedTriggerId,
            remarks: remarks,
        };

        try {
            const res = await axios.post(`${apiURL}/api/resolveTrigger`, resolveData);
            if (!res.data.success) {
                console.log(res.data.error);
                return;
            }
            const updatedTriggers = res.data.data;

            if (updatedTriggers) {
                setTriggers(updatedTriggers);
                setSelectedTriggerId(null);
                setRemarks("");
                alert("Trigger resolved successfully");
            }
        } catch (error) {
            console.error("Error resolving trigger:", error);
            alert("Failed to resolve trigger");
        }
    };

    // Format timestamp to readable date
    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString();
    };

    if (loading) {
        return <div className="p-4 text-center text-gray-300 bg-gray-900">Loading triggers...</div>;
    }

    return (
        <div className=" text-gray-200">
            <h1 className="max-w-7xl mx-auto text-2xl font-bold mb-4 text-white px-4">Triggers</h1>

            {/* Filter Controls */}
            <div className="max-w-7xl mx-auto mb-4 flex gap-2 px-4">
                <button
                    className={`text-sm px-2 py-1 rounded ${
                        filter === "all" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                    onClick={() => setFilter("all")}
                >
                    All
                </button>
                <button
                    className={`text-sm px-2 py-1 rounded ${
                        filter === "unresolved" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    } ${triggers.some((trigger) => !trigger.resolved) && "border-b-2 border-red-500"}`}
                    onClick={() => setFilter("unresolved")}
                >
                    Unresolved
                </button>
                <button
                    className={`text-sm px-2 py-1 rounded ${
                        filter === "resolved" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                    onClick={() => setFilter("resolved")}
                >
                    Resolved
                </button>
            </div>

            {/* Triggers Table */}
            <div className="px-2 max-w-7xl mx-auto">
                <div className="overflow-x-auto border border-gray-700 rounded max-h-[50vh]">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="sticky top-0 bg-gray-800">
                            <tr className="">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Zone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trigger Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Remarks</th>
                            </tr>
                        </thead>
                        <tbody ref={tableBody} className="bg-gray-800 divide-y divide-gray-700">
                            {filteredTriggers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                                        No triggers found
                                    </td>
                                </tr>
                            ) : (
                                filteredTriggers.map((trigger) => (
                                    <tr key={trigger.id} className={trigger.resolved ? "bg-green-900/30" : "bg-red-900/30 animate-alert"}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trigger.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{trigger.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{trigger.zone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(trigger.triggerTime)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    trigger.resolved ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                                                }`}
                                            >
                                                {trigger.resolved ? "Resolved" : "Unresolved"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {!trigger.resolved && (
                                                <button
                                                    className="sticky text-red-200 bg-red-900 border-2 border-red-700 font-bold px-2 py-1 rounded-sm hover:text-white cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedTriggerId(trigger.id);
                                                        setRemarks("");
                                                    }}
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                            {trigger.resolved && (
                                                <span title={trigger.remarks || ""} className="text-gray-300">
                                                    Resolved at {formatDate(trigger.resolveTime!)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-red-300">
                                            {trigger.remarks || "Trigger unresolved!"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Full Screen Resolve Trigger Form */}
            {selectedTriggerId && (
                <div className="fixed inset-0 bg-black bg-opacity-70 px-4 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl border border-gray-600">
                        <h2 className="text-xl font-semibold mb-4 text-white">Resolve Trigger</h2>
                        <p className="mb-4 text-gray-300">
                            Resolving trigger ID: <span className="font-medium text-blue-300">{selectedTriggerId}</span>
                        </p>

                        {/* Trigger Details */}
                        {triggers.find((t) => t.id === selectedTriggerId) && (
                            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2 text-white">Trigger Details</h3>
                                {(() => {
                                    const trigger = triggers.find((t) => t.id === selectedTriggerId)!;
                                    return (
                                        <div className="grid grid-cols-2 gap-2 text-gray-300">
                                            <div className="font-semibold text-gray-200">ID:</div>
                                            <div>{trigger.id}</div>
                                            <div className="font-semibold text-gray-200">Type:</div>
                                            <div>{trigger.type}</div>
                                            <div className="font-semibold text-gray-200">Zone:</div>
                                            <div>{trigger.zone}</div>
                                            <div className="font-semibold text-gray-200">Trigger Time:</div>
                                            <div>{formatDate(trigger.triggerTime)}</div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Resolution Remarks</label>
                            <textarea
                                className="w-full border border-gray-600 rounded-md shadow-sm p-3 bg-gray-700 text-white"
                                rows={5}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter resolution details..."
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                className="px-5 py-2 bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition-colors"
                                onClick={() => setSelectedTriggerId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                                onClick={handleResolveTrigger}
                            >
                                Confirm Resolution
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TriggerManagement;
