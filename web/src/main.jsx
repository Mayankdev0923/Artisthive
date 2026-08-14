import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import SuperTokens from 'supertokens-auth-react';
import { SessionAuth } from 'supertokens-auth-react/recipe/session';
import App from './App';
import './supertokens.js';
import './index.css';

SuperTokens.init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SessionAuth>
        <App />
      </SessionAuth>
    </BrowserRouter>
  </React.StrictMode>
);