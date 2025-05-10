import React, { createContext, useContext, useState, useEffect } from 'react';

const StadiumContext = createContext();

export function useStadium() {
  return useContext(StadiumContext);
}

export function StadiumProvider({ children }) {
  const [selectedStadium, setSelectedStadiumState] = useState(() => {
    const saved = localStorage.getItem('selectedStadium');
    return saved ? JSON.parse(saved) : null;
  });

  const setSelectedStadium = (stadium) => {
    setSelectedStadiumState(stadium);
    if (stadium) {
      localStorage.setItem('selectedStadium', JSON.stringify(stadium));
    } else {
      localStorage.removeItem('selectedStadium');
    }
  };

  const value = {
    selectedStadium,
    setSelectedStadium
  };

  return (
    <StadiumContext.Provider value={value}>
      {children}
    </StadiumContext.Provider>
  );
}
