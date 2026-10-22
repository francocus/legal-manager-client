import { createContext, useContext } from 'react';

export const DashboardDataContext = createContext(null);

export const useDashboardData = () => {
  const context = useContext(DashboardDataContext);

  if (!context) {
    throw new Error('useDashboardData debe usarse dentro de un DashboardDataProvider.');
  }

  return context;
};
