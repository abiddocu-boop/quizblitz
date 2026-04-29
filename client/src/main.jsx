import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './styles/index.css';

import DashboardLayout from './components/layout/DashboardLayout';
import Login       from './pages/auth/Login';
import Register    from './pages/auth/Register';
import Overview    from './pages/dashboard/Overview';
import QuizList    from './pages/dashboard/QuizList';
import CreateQuiz  from './pages/dashboard/CreateQuiz';
import Analytics   from './pages/dashboard/Analytics';
import HostGame    from './pages/game/HostGame';
import StudentGame from './pages/game/StudentGame';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/join"     element={<StudentGame />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard"                  element={<Overview />} />
            <Route path="/dashboard/quizzes"          element={<QuizList />} />
            <Route path="/dashboard/quizzes/:id/edit" element={<CreateQuiz />} />
            <Route path="/dashboard/create"           element={<CreateQuiz />} />
            <Route path="/dashboard/analytics"        element={<Analytics />} />
          </Route>
          <Route path="/host/:quizId" element={<HostGame />} />
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
