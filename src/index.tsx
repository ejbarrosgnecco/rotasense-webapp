import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import { Helmet } from "react-helmet";
import App from './App';
import { Toaster } from 'react-hot-toast';

// State management
import { Provider } from 'react-redux';
import { persistor, store } from "./store/store";
import { PersistGate } from 'redux-persist/integration/react';

// Core styles
import "./styles/layout.scss";
import "./styles/modals.scss";
import "./styles/tables.scss";
import "./styles/inputs.scss";
import "./styles/buttons.scss";
import "./styles/accordions.scss";
import "./styles/boxes.scss";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <BrowserRouter>
    <Helmet>
      <script src="https://kit.fontawesome.com/fc576cdb67.js" crossOrigin="anonymous" async></script>
    </Helmet>

    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
          <App/>

          <Toaster
            position="bottom-right"
          />
      </PersistGate>
    </Provider>
  </BrowserRouter>
);
