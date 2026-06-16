import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';
import DocumentDetail from './pages/DocumentDetail';
import SearchPage from './pages/Search';
import BorrowList from './pages/Borrow/BorrowList';
import Desensitization from './pages/Desensitization/Desensitization';
import Annotations from './pages/Annotations';
import UserList from './pages/User/UserList';
import LogList from './pages/Log/LogList';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CaseList />} />
        <Route path="cases" element={<CaseList />} />
        <Route path="cases/:id" element={<CaseDetail />} />
        <Route path="documents/:id" element={<DocumentDetail />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="borrow" element={<BorrowList />} />
        <Route path="desensitization" element={<Desensitization />} />
        <Route path="annotations" element={<Annotations />} />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UserList />
            </ProtectedRoute>
          }
        />
        <Route
          path="logs"
          element={
            <ProtectedRoute roles={['admin']}>
              <LogList />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
