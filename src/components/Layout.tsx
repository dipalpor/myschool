import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  CalendarCheck, 
  FileText, 
  LogOut,
  GraduationCap,
  Briefcase,
  ClipboardList,
  Shield,
  Calendar,
  Search,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { NotificationCenter } from './NotificationCenter';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, show: true },
    { name: 'Students', path: '/students', icon: Users, show: hasPermission('students') },
    { name: 'Teachers', path: '/teachers', icon: Briefcase, show: hasPermission('teachers') },
    { name: 'Fees', path: '/fees', icon: CreditCard, show: hasPermission('fees') },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck, show: hasPermission('attendance') },
    { name: 'Exams', path: '/exams', icon: ClipboardList, show: hasPermission('exams') },
    { name: 'Timetable', path: '/timetable', icon: Calendar, show: hasPermission('timetable') },
    { name: 'Communication', path: '/communication', icon: MessageSquare, show: isAdmin },
    { name: 'Reports', path: '/reports', icon: FileText, show: hasPermission('reports') },
    { name: 'Admin Panel', path: '/admin-panel', icon: Shield, show: isAdmin },
    // Parent Portal Items
    { name: 'My Dashboard', path: '/parent/dashboard', icon: LayoutDashboard, show: user?.role === 'parent' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="bg-blue-600 p-2 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-800">My School ERP</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="relative w-96 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="w-px h-6 bg-gray-100 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-900">{user?.email}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
