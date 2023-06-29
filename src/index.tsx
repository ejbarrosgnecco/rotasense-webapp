import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import { Helmet } from "react-helmet";
import App from './App';

// State management
import { Provider } from 'react-redux';
import { persistor, store } from "./store/store";
import { PersistGate } from 'redux-persist/integration/react';
import Layout from './layout';

// Core styles
import "./styles/layout.scss";

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
        <Layout>
          <App/>
        </Layout>
      </PersistGate>
    </Provider>
  </BrowserRouter>
);
