import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import SecurityDashboard from './pages/SecurityDashboard';

//pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import BrowseItems from './pages/BrowseItems';
import MyItems from './pages/MyItems';
import Notifications from './pages/Notifications';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes - must be logged in */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/report-lost"
          element={
            <ProtectedRoute>
              <ReportLost />
            </ProtectedRoute>
          }
        />

        <Route
          path="/report-found"
          element={
            <ProtectedRoute>
              <ReportFound />
            </ProtectedRoute>
          }
        />

        <Route
          path="/browse-items"
          element={
            <ProtectedRoute>
              <BrowseItems />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-items"
          element={
            <ProtectedRoute>
              <MyItems />
            </ProtectedRoute>
          }
        />

        <Route
          path="/security"
          element={
            <ProtectedRoute allowedRoles={['SECURITY', 'ADMIN']}>
              <SecurityDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
