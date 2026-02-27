import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateScan from './pages/CreateScan';
import ActiveScan from './pages/ActiveScan';
import Vulnerabilities from './pages/Vulnerabilities';
import FalsePositives from './pages/FalsePositives';
import AssetView from './pages/AssetView';
import Topology from './pages/Topology';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/scans/new" element={<ProtectedRoute><CreateScan /></ProtectedRoute>} />
      <Route path="/scans/:id/live" element={<ProtectedRoute><ActiveScan /></ProtectedRoute>} />
      <Route path="/vulnerabilities" element={<ProtectedRoute><Vulnerabilities /></ProtectedRoute>} />
      <Route path="/false-positives" element={<ProtectedRoute><FalsePositives /></ProtectedRoute>} />
      <Route path="/assets" element={<ProtectedRoute><AssetView /></ProtectedRoute>} />
      <Route path="/topology" element={<ProtectedRoute><Topology /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
