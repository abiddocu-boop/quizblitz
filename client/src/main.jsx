import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/index.css';

import Home          from './pages/Home.jsx';
import Join          from './pages/Join.jsx';
import StudentGame   from './pages/StudentGame.jsx';
import HostDashboard from './pages/HostDashboard.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<Home />} />
        <Route path="/join"  element={<Join />} />
        <Route path="/game"  element={<StudentGame />} />
        <Route path="/host"  element={<HostDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
