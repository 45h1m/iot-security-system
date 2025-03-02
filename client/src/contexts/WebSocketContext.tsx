import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';

// Define the shape of our context
interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  lastMessage: any | null;
  sendMessage: (message: string | object) => void;
  connect: (url: string) => void;
  disconnect: () => void;
  connectionError: string | null;
}

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
  connect: () => {},
  disconnect: () => {},
  connectionError: null,
});

// Props for our provider
interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  onOpen,
  onMessage,
  onClose,
  onError,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const reconnectCount = useRef<number>(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Function to reset connection state
  const resetState = useCallback(() => {
    setIsConnected(false);
    socketRef.current = null;
    setSocket(null);
    setConnectionError(null);
  }, []);

  // Function to establish a WebSocket connection
  const connect = useCallback((connectionUrl: string) => {
    // Clear any existing reconnect timers
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    // Close any existing connections
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      const newSocket = new WebSocket(connectionUrl);
      socketRef.current = newSocket;
      setSocket(newSocket);
      setConnectionError(null);
      
      // Set up event listeners
      newSocket.onopen = (event) => {
        setIsConnected(true);
        reconnectCount.current = 0;
        if (onOpen) onOpen(event);
      };
      
      newSocket.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setLastMessage(parsedData);
        } catch (e) {
          // If not JSON, use the raw data
          setLastMessage(event.data);
        }
        
        if (onMessage) onMessage(event);
      };
      
      newSocket.onclose = (event) => {
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure and we haven't exceeded our attempts
        if (!event.wasClean && reconnectCount.current < reconnectAttempts) {
          reconnectCount.current += 1;
          reconnectTimerRef.current = setTimeout(() => {
            connect(connectionUrl);
          }, reconnectInterval);
        }
        
        if (onClose) onClose(event);
      };
      
      newSocket.onerror = (event) => {
        setConnectionError('WebSocket connection error');
        if (onError) onError(event);
      };
      
    } catch (error) {
      setConnectionError(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [onOpen, onMessage, onClose, onError, reconnectAttempts, reconnectInterval]);

  // Connect using the provided URL when component mounts
  useEffect(() => {
    if (url) {
      connect(url);
    }
    
    return () => {
      // Clean up on unmount
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [url, connect]);

  // Function to send messages
  const sendMessage = useCallback((message: string | object) => {
    if (socketRef.current && isConnected) {
      const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
      socketRef.current.send(messageToSend);
    } else {
      setConnectionError('Cannot send message: WebSocket is not connected');
    }
  }, [isConnected]);

  // Function to manually disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Closed by user'); // 1000 is a normal closure
    }
    
    resetState();
  }, [resetState]);

  // Context value
  const contextValue: WebSocketContextType = {
    socket,
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    connectionError,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook for using the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
};