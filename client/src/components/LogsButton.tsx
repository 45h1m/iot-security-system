import React, { useState, useEffect } from "react";
import axios from "axios";
import { useWebSocket } from "../contexts/WebSocketContext";

// Define the Log interface
interface Log {
    id: string;
    date: string;
    type: "trigger" | "panic" | "armed" | "disarmed" | "resolve";
    description: string;
    details?: string;
}

// Props for the LogsButton component
interface LogsButtonProps {
    className?: string;
}

const LogsButton: React.FC<LogsButtonProps> = ({ className = "" }) => {
    // State variables
    const [logs, setLogs] = useState<Log[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterText, setFilterText] = useState("");
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [newLog, setNewLog] = useState<boolean>(false);
    const { lastMessage, isConnected } = useWebSocket();

    const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:80';

    useEffect(() => {
        if (lastMessage && lastMessage.newLog) {
            fetchLogs();
            if (!isOpen) {
                setNewLog(true);
            }
        }
    }, [lastMessage]);

    useEffect(() => {
        fetchLogs();
    }, [isConnected]);

    // Fetch logs from API
    const fetchLogs = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${apiURL}/api/logs`);
            setLogs(response.data.data);
            console.log(response.data);
            setFilteredLogs(response.data.data);
        } catch (err) {
            setError("Failed to fetch logs. Please try again.");
            console.error("Error fetching logs:", err);
        } finally {
            setLoading(false);
        }
    };

    // Toggle the logs panel
    const togglePanel = () => {
        if (!isOpen) {
            fetchLogs();
            setNewLog(false);
        }
        setIsOpen(!isOpen);
    };

    // Apply filters when filter state changes
    useEffect(() => {
        if (logs.length > 0) {
            let filtered = [...logs];

            // Apply level filter
            if (filterLevel !== "all") {
                filtered = filtered.filter((log) => log.type === filterLevel);
            }

            // Apply text filter
            if (filterText) {
                const searchTerm = filterText.toLowerCase();
                filtered = filtered.filter(
                    (log) =>
                        log.description.toLowerCase().includes(searchTerm) ||
                        log.id.toLowerCase().includes(searchTerm) ||
                        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm))
                );
            }

            setFilteredLogs(filtered);
        }
    }, [filterText, filterLevel, logs]);

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="relative bg-slate-800">
            {/* Button showing number of logs */}
            <button
                onClick={togglePanel}
                className={`relative flex items-center cursor-pointer text-white font-medium py-1 px-2 rounded-md transition-colors ${className}`}
            >
                Logs {logs.length > 0 ? `(${logs.length})` : "0"}
                {logs.length > 0 && newLog && <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full"></span>}
            </button>

            {/* Logs panel */}
            {isOpen && (
                <div className="fixed px-2 z-10 right-0 w-full mt-2 max-w-xl">
                    <div className="bg-slate-800 rounded-md shadow-lg border border-slate-700 flex flex-col max-h-[70vh] ">
                        <div className="p-4 border-b border-slate-700 bg-slate-800 flex flex-col">
                            <div className="text-lg font-medium mb-3">Logs</div>

                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Filter logs..."
                                    className="flex-grow px-3 py-2 border border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                />

                                <select
                                    className="bg-slate-800 px-3 py-2 border border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filterLevel}
                                    onChange={(e) => setFilterLevel(e.target.value)}
                                >
                                    <option value="all">All</option>
                                    <option value="panic">Panic</option>
                                    <option value="trigger">Trigger</option>
                                    <option value="armed">Armed</option>
                                    <option value="disarmed">Disarmed</option>
                                </select>

                                <button
                                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm transition-colors"
                                    onClick={() => fetchLogs()}
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Logs content */}
                        <div className="overflow-y-auto flex-grow">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500">Loading logs...</div>
                            ) : error ? (
                                <div className="p-4 text-center text-red-500">{error}</div>
                            ) : filteredLogs.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    {logs.length === 0 ? "No logs available" : "No logs match your filters"}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-700">
                                    {filteredLogs.map((log) => (
                                        <div key={log.id} className={`p-3 hover:bg-gray-800 ${
                                            log.type === "trigger" || log.type === "panic"
                                                ? "bg-red-900/20 text-red-200"
                                                : log.type === "armed"
                                                ? "bg-yellow-900/20 text-yellow-100"
                                                : "bg-blue-900/10 text-blue-100"
                                        }`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-500">{new Date(log.date).toLocaleString()}</span>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        log.type === "trigger" || log.type === "panic"
                                                            ? "bg-red-800 text-red-200"
                                                            : log.type === "armed"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-blue-100 text-blue-800"
                                                    }`}
                                                >
                                                    {log.type}
                                                </span>
                                            </div>
                                            <div className="text-sm">{log.description}</div>
                                            {log.details && (
                                                <div className="mt-1 text-xs text-gray-600 bg-gray-600 p-2 rounded-md overflow-x-auto">
                                                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Panel footer */}
                        <div className="p-3 border-t border-slate-700 bg-gray-800 flex justify-between items-center text-sm">
                            <span className="text-gray-500">
                                {filteredLogs.length} of {logs.length || 0} logs
                            </span>
                            <button className="text-blue-600 hover:text-blue-800" onClick={() => setIsOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogsButton;
