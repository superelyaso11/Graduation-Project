import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

//pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ReportLost from './pages/ReportLost'

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes */}
                    <Route path='/login' element={<Login />} />
                    <Route path='/register' element={<Register />} />

                    {/* Protected routes - must be logged in */}
                    <Route path='/dashboard' element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path='/report-lost' element={
                        <protectedRoute>
                            <ReportLost />
                        </protectedRoute>
                    } />

                    {/* Redirect root to login */}
                    <Route path='/' element={<Navigate to='/login' />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App