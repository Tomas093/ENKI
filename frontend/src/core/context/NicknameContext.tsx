"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface NicknameContextValue {
  nickname: string;
  setNickname: (name: string) => void;
}

const NicknameContext = createContext<NicknameContextValue>({
  nickname: "",
  setNickname: () => {},
});

export function NicknameProvider({ children }: { children: ReactNode }) {
  const [nickname, setNicknameState] = useState("");

  // Persist across hard reloads but clear when tab closes (sessionStorage)
  useEffect(() => {
    const saved = sessionStorage.getItem("enki_nickname");
    if (saved) setNicknameState(saved);
  }, []);

  const setNickname = (name: string) => {
    setNicknameState(name);
    sessionStorage.setItem("enki_nickname", name);
  };

  return (
    <NicknameContext.Provider value={{ nickname, setNickname }}>
      {children}
    </NicknameContext.Provider>
  );
}

export function useNickname() {
  return useContext(NicknameContext);
}
