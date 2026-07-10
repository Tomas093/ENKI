"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Howl, Howler } from "howler";

type MusicTrack = "elevator" | "tense" | "epic";
type SfxTrack = "correct" | "incorrect" | "tick";

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  userInteracted: boolean;
  playMusic: (track: MusicTrack) => void;
  stopMusic: () => void;
  playSFX: (track: SfxTrack) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  
  const currentMusicRef = useRef<MusicTrack | null>(null);
  const musicHowls = useRef<Record<MusicTrack, Howl | null>>({
    elevator: null,
    tense: null,
    epic: null
  });
  const sfxHowls = useRef<Record<SfxTrack, Howl | null>>({
    correct: null,
    incorrect: null,
    tick: null
  });

  // Initialize howls and local storage on mount
  useEffect(() => {
    const savedMute = localStorage.getItem("enki_muted") === "true";
    setIsMuted(savedMute);
    Howler.mute(savedMute);

    musicHowls.current = {
      elevator: new Howl({ src: ["/audio/elevator.mp3"], loop: true, volume: 0.5 }),
      tense: new Howl({ src: ["/audio/tense.mp3"], loop: true, volume: 0.5 }),
      epic: new Howl({ 
        src: ["/audio/epic.mp3"], 
        sprite: {
          woohoo: [14000, 14000] // Starts at 14s, plays for 14s
        },
        volume: 0.5 
      }),
    };

    sfxHowls.current = {
      correct: new Howl({ src: ["/audio/correct.wav"], volume: 0.7 }),
      incorrect: new Howl({ src: ["/audio/incorrect.wav"], volume: 0.7 }),
      tick: new Howl({ src: ["/audio/tick.wav"], volume: 0.8 }),
    };

    return () => {
      // Cleanup all sounds on full unmount
      Object.values(musicHowls.current).forEach(h => h?.unload());
      Object.values(sfxHowls.current).forEach(h => h?.unload());
    };
  }, []);

  // Handle interaction separately
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
        // If there's a pending track that tried to play before interaction, play it now
        if (currentMusicRef.current) {
          const track = musicHowls.current[currentMusicRef.current];
          if (track && !track.playing()) {
            if (currentMusicRef.current === "epic") {
              track.play("woohoo");
            } else {
              track.play();
            }
            track.fade(0, 0.5, 1000);
          }
        }
      }
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [userInteracted]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem("enki_muted", String(next));
    Howler.mute(next);
  };

  const playMusic = (track: MusicTrack) => {
    if (currentMusicRef.current === track) return; // Already playing this track
    
    // Fade out old track
    if (currentMusicRef.current) {
      const oldHowl = musicHowls.current[currentMusicRef.current];
      if (oldHowl && oldHowl.playing()) {
        oldHowl.fade(oldHowl.volume(), 0, 1000);
        setTimeout(() => oldHowl.stop(), 1000);
      }
    }

    currentMusicRef.current = track;
    
    // Fade in new track, if user has interacted
    const newHowl = musicHowls.current[track];
    if (newHowl && userInteracted) {
      newHowl.volume(0);
      if (track === "epic") {
        newHowl.play("woohoo");
      } else {
        newHowl.play();
      }
      newHowl.fade(0, 0.5, 1000);
    }
  };

  const stopMusic = () => {
    if (currentMusicRef.current) {
      const track = musicHowls.current[currentMusicRef.current];
      if (track && track.playing()) {
        track.fade(track.volume(), 0, 500);
        setTimeout(() => track.stop(), 500);
      }
      currentMusicRef.current = null;
    }
  };

  const playSFX = (track: SfxTrack) => {
    if (!userInteracted) return;
    const howl = sfxHowls.current[track];
    if (howl) {
      howl.play();
    }
  };

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute, userInteracted, playMusic, stopMusic, playSFX }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
