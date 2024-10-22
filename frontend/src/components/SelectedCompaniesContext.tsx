import React, { createContext, useContext, useState, ReactNode } from 'react';

const SelectedCompaniesContext = createContext<{
  selectedCompanyIds: (number | string)[];
  setSelectedCompanyIds: React.Dispatch<React.SetStateAction<(number | string)[]>>;
  clearSelectedCompanies: () => void;
} | null>(null);

export const SelectedCompaniesProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<(number | string)[]>([]);

  const clearSelectedCompanies = () => setSelectedCompanyIds([]);

  return (
    <SelectedCompaniesContext.Provider value={{ selectedCompanyIds, setSelectedCompanyIds, clearSelectedCompanies }}>
      {children}
    </SelectedCompaniesContext.Provider>
  );
};

export const useSelectedCompanies = () => {
  const context = useContext(SelectedCompaniesContext);
  if (!context) {
    throw new Error("useSelectedCompanies must be used within a SelectedCompaniesProvider");
  }
  return context;
};
