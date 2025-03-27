// AudioContext.tsx
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playAudio: (src: string) => void;
  pauseAudio: () => void;
  setVolume: (volume: number) => void;
  currentSrc: string | null;
  audioElement: HTMLAudioElement;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  audioRef.current.loop = true;
  
  useEffect(() => {
    audioRef.current.muted = isMuted;
  }, [isMuted]);
  
  const toggleMute = (): void => {
    setIsMuted(prev => !prev);
  };
  
  const playAudio = (src: string): void => {
    setCurrentSrc(src);
    audioRef.current.src = src;
    audioRef.current.play().catch(error => {
      console.error('Error playing audio:', error);
    });
  };
  
  const pauseAudio = (): void => {
    audioRef.current.pause();
  };
  
  const setVolume = (volume: number): void => {
    // Ensure volume is between 0 and 1
    const safeVolume = Math.max(0, Math.min(1, volume));
    audioRef.current.volume = safeVolume;
  };
  
  return (
    <AudioContext.Provider value={{ 
      isMuted, 
      toggleMute, 
      playAudio, 
      pauseAudio,
      setVolume,
      currentSrc,
      audioElement: audioRef.current 
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};