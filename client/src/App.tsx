import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { UserList } from './pages/UserList';
import { Profile } from './pages/Profile';
import { Students } from './pages/Students';
import { Coordinators } from './pages/Coordinators';
import { Companies } from './pages/Companies';
import { Enrollment } from './pages/Enrollment';
import { ProgramRequirements } from './pages/ProgramRequirements';
import { Documents } from './pages/Documents';
import { Announcements } from './pages/Announcements';
import { Archives } from './pages/Archives';
import { Messages } from './pages/Messages';
import { UploadDocuments } from './pages/UploadDocuments';
import { MyTasks } from './pages/MyTasks';
import { CoordinatorTasks } from './pages/CoordinatorTasks';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<DashboardLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/users" element={<UserList />} />
                            <Route path="/profile" element={<Profile />} />
                            {/* Student Routes */}
                            <Route path="/messages" element={<Messages />} />
                            <Route path="/upload-documents" element={<UploadDocuments />} />
                            <Route path="/my-tasks" element={<MyTasks />} />
                            {/* Coordinator Routes */}
                            <Route path="/tasks" element={<CoordinatorTasks />} />
                            {/* Admin & Coordinator Routes */}
                            <Route path="/students" element={<Students />} />
                            <Route path="/coordinators" element={<Coordinators />} />
                            <Route path="/companies" element={<Companies />} />
                            <Route path="/enrollment" element={<Enrollment />} />
                            <Route path="/requirements" element={<ProgramRequirements />} />
                            <Route path="/documents" element={<Documents />} />
                            <Route path="/announcements" element={<Announcements />} />
                            <Route path="/archives" element={<Archives />} />
                        </Route>
                    </Route>

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
