import React, { useState, useEffect } from 'react';
import { Activity, List, Wifi, WifiOff } from 'lucide-react';
import LogsButton from './LogsButton';

const Header = ({ isConnected = false, logCount = 0 }) => {
  
  return (
    <header className="sticky top-0 bg-slate-800 text-white p-4 shadow-md border-b border-slate-700">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center justify-center flex-wrap space-x-2">
          <img className='w-15' src="/sense.svg" alt="logo" />
          <img className='w-25' src="/sense-25.png" alt="text-logo" />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <LogsButton/>
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