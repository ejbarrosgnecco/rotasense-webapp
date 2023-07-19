import React from 'react';
import { Route, Routes as Switch } from "react-router-dom";
import Layout from './layout';
import Login from './pages/login/login';
import Organisation from './pages/organisation/organisation';
import ManageSchedules from './pages/schedules/schedules';
import ProtectedRoute from './protectedRoute';

function App() {
  return (
    <Switch>
      <Route path="/login" element={<Login/>}/>
      <Route path="/schedules" element={
        <ProtectedRoute>
          <ManageSchedules/>
        </ProtectedRoute>}/>
      <Route path="/organisation" element={
        <ProtectedRoute>
          <Organisation/>
        </ProtectedRoute>
      }/>
      <Route path="/" element={
        <ProtectedRoute>
          <></>
        </ProtectedRoute>
      }/>
       <Route path="/settings" element={
        <ProtectedRoute>
          <></>
        </ProtectedRoute>
      }/>
    </Switch>
  );
}

export default App;
