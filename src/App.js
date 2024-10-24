import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { MsalProvider, MsalAuthenticationTemplate } from '@azure/msal-react';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { msalConfig } from './config/AuthConfig';
import { AuthProvider } from './components/AuthProvider';
import { AppProvider } from './contexts/AppContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard/Dashboard';
import ExpenseForm from './components/Expenses/ExpenseForm';
import ExpenseList from './components/Expenses/ExpenseList';
import ExpenseDetail from './components/Expenses/ExpenseDetail';
import ExpenseEdit from './components/Expenses/ExpenseEdit';
import ApprovalList from './components/Approvals/ApprovalList';
import Profile from './components/Profile/Profile';
import './App.css';

const msalInstance = new PublicClientApplication(msalConfig);

const LoadingComponent = () => <div>Loading...</div>;

const ErrorComponent = (error) => {
  console.error('Auth Error:', error);
  return <div>Authentication error</div>;
};

function AppRoutes() {
  return (
    <AppProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<ExpenseList />} />
          <Route path="/expenses/new" element={<ExpenseForm />} />
          <Route path="/expenses/:id" element={<ExpenseDetail />} />
          <Route path="/expenses/:id/edit" element={<ExpenseEdit />} />
          <Route path="/approvals" element={<ApprovalList />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </AppProvider>
  );
}

function App() {
  return (
    <Router>
      <MsalProvider instance={msalInstance}>
        <MsalAuthenticationTemplate
          interactionType={InteractionType.Redirect}
          loadingComponent={LoadingComponent}
          errorComponent={ErrorComponent}
        >
          <AppRoutes />
        </MsalAuthenticationTemplate>
      </MsalProvider>
    </Router>
  );
}

export default App;