import App from './App'; // this must be first for hot reloading
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import { Router } from 'react-tiniest-router';
import { routes } from './routes';
import { UserProvider } from '~/auth';

ReactDOM.render(
  <React.StrictMode>
    <UserProvider>
      <Router routes={routes}>
        <App />
      </Router>
    </UserProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
