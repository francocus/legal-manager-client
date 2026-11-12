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
import { initScrollActivity } from './components/services/scroll/scrollActivity';

// Marks <html> as .is-scrolling while anything scrolls; the styled scrollbars
// key off that class to hide themselves one second after the last scroll.
initScrollActivity();

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
