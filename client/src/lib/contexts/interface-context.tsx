import { createContext, useState, useContext, ReactNode } from 'react';

type InterfaceType = 'welcome' | 'flight' | 'hotel' | 'shopping';

type InterfaceContextType = {
  activeInterface: InterfaceType;
  setActiveInterface: (interface_: InterfaceType) => void;
};

const InterfaceContext = createContext<InterfaceContextType>({
  activeInterface: 'welcome',
  setActiveInterface: () => {},
});

export const InterfaceContextProvider = ({ children }: { children: ReactNode }) => {
  const [activeInterface, setActiveInterface] = useState<InterfaceType>('welcome');

  return (
    <InterfaceContext.Provider
      value={{
        activeInterface,
        setActiveInterface,
      }}
    >
      {children}
    </InterfaceContext.Provider>
  );
};

export const useInterface = () => useContext(InterfaceContext);
