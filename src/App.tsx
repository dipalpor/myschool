import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { FeeManagement } from './components/FeeManagement';
import { AttendanceManagement } from './components/AttendanceManagement';
import { TeacherManagement } from './components/TeacherManagement';
import { ExamsResults } from './components/ExamsResults';
import { AdminPanel } from './components/AdminPanel';
import { TimetableManagement } from './components/TimetableManagement';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { Communication } from './components/Communication';
import { Reports } from './components/Reports';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout children={<Dashboard />} />}>
                <Route path="/" element={<Dashboard />} />
              </Route>
              <Route element={<Layout children={<StudentManagement />} />}>
                <Route path="/students" element={<StudentManagement />} />
              </Route>
              <Route element={<Layout children={<TeacherManagement />} />}>
                <Route path="/teachers" element={<TeacherManagement />} />
              </Route>
              <Route element={<Layout children={<FeeManagement />} />}>
                <Route path="/fees" element={<FeeManagement />} />
              </Route>
              <Route element={<Layout children={<AttendanceManagement />} />}>
                <Route path="/attendance" element={<AttendanceManagement />} />
              </Route>
              <Route element={<Layout children={<ExamsResults />} />}>
                <Route path="/exams" element={<ExamsResults />} />
              </Route>
              <Route element={<Layout children={<TimetableManagement />} />}>
                <Route path="/timetable" element={<TimetableManagement />} />
              </Route>
              <Route element={<Layout children={<ParentDashboard />} />}>
                <Route path="/parent/dashboard" element={<ParentDashboard />} />
              </Route>
              <Route element={<Layout children={<Communication />} />}>
                <Route path="/communication" element={<Communication />} />
              </Route>
              <Route element={<Layout children={<AdminPanel />} />}>
                <Route path="/admin-panel" element={<AdminPanel />} />
              </Route>
              <Route element={<Layout children={<Reports />} />}>
                <Route path="/reports" element={<Reports />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
