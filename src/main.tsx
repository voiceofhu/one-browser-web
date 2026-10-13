import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { Providers } from '@/components/providers';

import App from './App';
import './index.css';
import { startDevtoolsGuard } from '@/lib/devtools-guard';

if (startDevtoolsGuard()) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL} useTransitions={false}>
        <Providers>
          <App />
        </Providers>
      </BrowserRouter>
    </StrictMode>,
  );
}
