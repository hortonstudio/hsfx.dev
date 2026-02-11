"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface DocSectionContextValue {
  currentSection: string | undefined;
  setCurrentSection: (section: string | undefined) => void;
}

const DocSectionContext = createContext<DocSectionContextValue | undefined>(
  undefined
);

export function DocSectionProvider({ children }: { children: React.ReactNode }) {
  const [currentSection, setCurrentSectionState] = useState<string | undefined>();

  const setCurrentSection = useCallback((section: string | undefined) => {
    setCurrentSectionState(section);
  }, []);

  return (
    <DocSectionContext.Provider value={{ currentSection, setCurrentSection }}>
      {children}
    </DocSectionContext.Provider>
  );
}

export function useDocSection() {
  const context = useContext(DocSectionContext);
  if (!context) {
    throw new Error("useDocSection must be used within a DocSectionProvider");
  }
  return context;
}
