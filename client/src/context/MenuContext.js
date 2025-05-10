import React, { createContext, useContext, useState } from 'react';

const MenuContext = createContext();

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

export const MenuProvider = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [addons, setAddons] = useState([]);

  return (
    <MenuContext.Provider 
      value={{ 
        selectedCategory, 
        setSelectedCategory,
        categories,
        setCategories,
        menuItems,
        setMenuItems,
        addons,
        setAddons
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};
