import { createContext, useContext, useState } from 'react';

interface LayoutContextType {
  hideFooter: boolean;
  setHideFooter: (v: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType>({ hideFooter: false, setHideFooter: () => {} });

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [hideFooter, setHideFooter] = useState(false);
  return (
    <LayoutContext.Provider value={{ hideFooter, setHideFooter }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);
