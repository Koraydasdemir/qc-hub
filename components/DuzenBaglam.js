"use client";
import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext({ editMod: false, setEditMod: () => {} });

export function DuzenProvider({ children }) {
  const [editMod, setEditModState] = useState(false);

  useEffect(() => {
    try { setEditModState(localStorage.getItem("qc_duzen_mod") === "1"); } catch (e) {}
  }, []);

  function setEditMod(v) {
    setEditModState(v);
    try { localStorage.setItem("qc_duzen_mod", v ? "1" : "0"); } catch (e) {}
  }

  return <Ctx.Provider value={{ editMod, setEditMod }}>{children}</Ctx.Provider>;
}

export function useDuzenMod() {
  return useContext(Ctx);
}
