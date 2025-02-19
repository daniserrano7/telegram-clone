import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/home.page';
import { LoginPage } from './pages/login.page';
import { RegisterPage } from './pages/register.page';
import { ChatsPage } from './pages/chats.page';
import { App } from './App';
import { ProtectedRoute } from './router/protected-route';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App>
      <BrowserRouter>
        <Routes>
          <Route index path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/chats"
            element={
              <ProtectedRoute>
                <ChatsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </App>
  </StrictMode>
);
