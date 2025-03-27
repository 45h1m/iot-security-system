import { Clock, Power, X, Save, Edit } from "lucide-react";
import { useState } from "react";

const ZoneCard = ({ zone, onSave }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: zone.name,
        description: zone.description,
        color: zone.color,
        enabled: zone.enabled,
    });

    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        onSave({ ...zone, ...formData });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            name: zone.name,
            description: zone.description,
            color: zone.color,
            enabled: zone.enabled,
        });
        setIsEditing(false);
    };

    // Format the last triggered time if it exists
    const formattedTime = zone.lastTriggered ? new Date(zone.lastTriggered).toLocaleString() : "Never";

    // Determine background color based on status
    const getBgColor = () => {
        if (zone.triggered) return "bg-zinc-800 border-red-600";
        if (zone.enabled) return "bg-zinc-900 border-green-600";
        return "bg-zinc-900 border-zinc-700";
    };

    return (
        <div
            className={`flex flex-col flex-1 rounded-md border border-l-4 p-3 shadow-md transition-all bg-zinc-900 ${getBgColor()} ${
                !isEditing && "cursor-pointer hover:bg-zinc-800"
            }`}
            onClick={() => !isEditing && setIsEditing(true)}
        >
            {!isEditing ? (
                // View Mode - Minimal Dark Theme
                <>
                    {zone.id && <p className="text-xs text-zinc-400 mt-1 line-clamp-1">ID: {zone.id}</p>}
                    <div className="flex justify-between items-center gap-2">
                        <h3 className="text-base font-medium text-zinc-100 leading-tight min-w-26">{zone.name}</h3>
                        <div className="flex items-center space-x-2">
                            <div
                                className={`w-2 h-2 rounded-full ${zone.triggered ? "bg-red-500" : zone.enabled ? "bg-green-500" : "bg-zinc-500"}`}
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                }}
                                className="text-zinc-400 hover:text-zinc-200"
                            >
                                <Edit size={12} />
                            </button>
                        </div>
                    </div>

                    {zone.description && <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{zone.description}</p>}

                    <div className="flex flex-wrap justify-between items-center mt-2 gap-2 text-xs text-zinc-500">
                        <div className="flex items-center space-x-1">
                            <Power size={12} className={zone.enabled ? "text-green-500" : "text-zinc-600"} />
                            <span>{zone.enabled ? "Active" : "Off"}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span className="whitespace-nowrap">{formattedTime}</span>
                        </div>
                    </div>

                    {zone.triggered && <div className="mt-2 py-0.5 px-2 bg-red-900 text-red-100 text-xs font-medium rounded text-center animate-alert">⚠ ALERT</div>}
                </>
            ) : (
                // Edit Mode - Dark Theme
                <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="text-zinc-200">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium">Edit Zone</h3>
                        <button type="button" onClick={handleCancel} className="text-zinc-500 hover:text-zinc-300">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full p-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={2}
                                className="w-full p-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">Color</label>
                            <select
                                name="color"
                                value={formData.color}
                                onChange={handleInputChange}
                                className="w-full p-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-200"
                            >
                                <option value="gray">Gray</option>
                                <option value="red">Red</option>
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                                <option value="yellow">Yellow</option>
                                <option value="purple">Purple</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="enabled"
                                name="enabled"
                                checked={formData.enabled}
                                onChange={handleInputChange}
                                className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-zinc-700 rounded bg-zinc-800"
                            />
                            <label htmlFor="enabled" className="ml-2 block text-xs text-zinc-400">
                                Enabled
                            </label>
                        </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="mr-2 px-2 py-1 text-xs border border-zinc-700 rounded shadow-sm text-zinc-400 hover:bg-zinc-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-2 py-1 text-xs bg-blue-700 border border-transparent rounded shadow-sm text-zinc-100 hover:bg-blue-600 flex items-center"
                        >
                            <Save size={12} className="mr-1" />
                            Save
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ZoneCard;
