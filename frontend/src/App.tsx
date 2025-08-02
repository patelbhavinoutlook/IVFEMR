import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import PatientRegistration from './pages/PatientRegistration';
import PatientList from './pages/PatientList';
import TreatmentModule from './pages/TreatmentModule';
import BillingModule from './pages/BillingModule';
import InventoryModule from './pages/InventoryModule';
import UserManagement from './pages/UserManagement';
import CompanySetup from './pages/CompanySetup';
import ClinicSetup from './pages/ClinicSetup';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Patient Management */}
          <Route path="patients">
            <Route index element={<PatientList />} />
            <Route path="register" element={<PatientRegistration />} />
            <Route path=":patientId/edit" element={<PatientRegistration />} />
          </Route>

          {/* Treatment Module */}
          <Route path="treatments">
            <Route index element={<TreatmentModule />} />
            <Route path=":patientId" element={<TreatmentModule />} />
          </Route>

          {/* Billing */}
          <Route path="billing">
            <Route index element={<BillingModule />} />
          </Route>

          {/* Inventory & Pharmacy */}
          <Route path="inventory">
            <Route index element={<InventoryModule />} />
          </Route>

          {/* Administration */}
          <Route path="admin">
            <Route path="users" element={<UserManagement />} />
            <Route path="companies" element={<CompanySetup />} />
            <Route path="clinics" element={<ClinicSetup />} />
          </Route>
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;