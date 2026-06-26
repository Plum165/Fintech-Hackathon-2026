import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import PaymentInterface from './paymentInterface.tsx';
import './frontend/css/style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PaymentInterface />
  </StrictMode>,
);