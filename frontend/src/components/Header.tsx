import { Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import LogsButton from "./LogsButton";
import { useAudio } from "../contexts/AudioContext";

const Header = ({ isConnected = false }) => {
    const { isMuted, toggleMute } = useAudio();

    return (
        <header className="sticky top-0 z-10 bg-slate-800 text-white p-4 shadow-md border-b border-slate-700">
            <div className="mx-auto flex justify-between items-center">
                <div className="flex items-center flex-wrap space-x-2">
                    <img className="w-15" src="/sense.svg" alt="logo" />
                    <img className="w-25" src="/sense-25.png" alt="text-logo" />
                    <p className="text-sm ">Realtime Security System</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleMute}
                        className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <div className="flex items-center space-x-2">
                        <LogsButton />
                    </div>

                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <>
                                <Wifi className="text-green-400" size={18} />
                                {/* <span className="text-sm text-green-400">Connected</span> */}
                            </>
                        ) : (
                            <>
                                <WifiOff className="text-red-400" size={18} />
                                {/* <span className="text-sm text-red-400">Disconnected</span> */}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
