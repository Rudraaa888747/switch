import { useState } from 'react';
import { LayoutContext } from '@/hooks/use-layout';

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [hideFooter, setHideFooter] = useState(false);
  return (
    <LayoutContext.Provider value={{ hideFooter, setHideFooter }}>
      {children}
    </LayoutContext.Provider>
  );
};
