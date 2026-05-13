import { createContext, useContext } from 'react';

export interface LayoutContextType {
  hideFooter: boolean;
  setHideFooter: (v: boolean) => void;
}

export const LayoutContext = createContext<LayoutContextType>({ 
  hideFooter: false, 
  setHideFooter: () => {} 
});

export const useLayout = () => useContext(LayoutContext);
