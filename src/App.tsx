import React from 'react';
import { Route, Routes as Switch } from "react-router-dom";
import ManageSchedules from './pages/schedules/manage/manage';

function App() {
  return (
    <Switch>
      <Route path="/schedules/manage" element={<ManageSchedules/>}/>
    </Switch>
  );
}

export default App;
