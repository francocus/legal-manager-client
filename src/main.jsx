import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './components/shared/ui/ui.css';
import { AuthenticationContextProvider } from './components/services/auth/AuthenticationContextProvider.jsx';
import { ThemeContextProvider } from './components/services/theme/ThemeContextProvider.jsx';
import { PreferencesContextProvider } from './components/services/preferences/PreferencesContextProvider.jsx';
import { ToastProvider } from './components/shared/toast/ToastProvider.jsx';
import ErrorBoundary from './components/shared/errorBoundary/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeContextProvider>
      <PreferencesContextProvider>
        <ToastProvider>
          <AuthenticationContextProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </AuthenticationContextProvider>
        </ToastProvider>
      </PreferencesContextProvider>
    </ThemeContextProvider>
  </StrictMode>,
);
