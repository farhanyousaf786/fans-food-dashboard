import React, { createContext, useContext, useState } from 'react';

const StadiumContext = createContext();

export function useStadium() {
  return useContext(StadiumContext);
}

export function StadiumProvider({ children }) {
  const [selectedStadium, setSelectedStadium] = useState(null);

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
