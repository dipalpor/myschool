import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Teacher, Permission } from './types';

interface UserSession {
  email: string;
  uid: string;
  role: 'admin' | 'teacher' | 'parent';
  permissions: Permission[];
  assignedClasses: string[];
  studentId?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  isAdmin: boolean;
  login: (id: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasPermission: (module: string, level?: 'read' | 'write' | 'full') => boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isAdmin: false,
  login: async () => ({ success: false }),
  logout: () => {},
  hasPermission: () => false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 1. Handle local session
    const savedUser = localStorage.getItem('school_erp_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAdmin(userData.role === 'admin');
    }
    setLoading(false);
  }, []);

  const login = async (id: string, pass: string) => {
    // 1. Check Super Admin (Hardcoded for initial setup)
    if (id === 'Admin' && pass === 'Admin') {
      const mockUser: UserSession = { 
        email: 'admin@school.erp', 
        uid: 'admin-123',
        role: 'admin',
        permissions: [{ module: 'admin', access: 'full' }],
        assignedClasses: []
      };
      setUser(mockUser);
      setIsAdmin(true);
      localStorage.setItem('school_erp_user', JSON.stringify(mockUser));
      return { success: true };
    }

    // 2. Check Teachers from Firestore
    try {
      const q = query(collection(db, 'teachers'), where('username', '==', id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const teacherDoc = querySnapshot.docs[0];
        const teacher = { id: teacherDoc.id, ...teacherDoc.data() } as Teacher;

        if (teacher.status === 'locked') {
          return { success: false, message: 'Account locked. Please contact Admin.' };
        }

        if (teacher.password === pass) {
          // Reset failed attempts on success
          await updateDoc(doc(db, 'teachers', teacher.id), { failedAttempts: 0 });

          const mockUser: UserSession = { 
            email: teacher.email, 
            uid: teacher.id,
            role: teacher.role,
            permissions: teacher.permissions,
            assignedClasses: teacher.assignedClasses
          };
          setUser(mockUser);
          setIsAdmin(teacher.role === 'admin');
          localStorage.setItem('school_erp_user', JSON.stringify(mockUser));
          return { success: true };
        } else {
          // Increment failed attempts
          const newFailedAttempts = (teacher.failedAttempts || 0) + 1;
          const newStatus = newFailedAttempts >= 3 ? 'locked' : 'active';
          
          await updateDoc(doc(db, 'teachers', teacher.id), { 
            failedAttempts: newFailedAttempts,
            status: newStatus
          });
          
          if (newStatus === 'locked') {
            return { success: false, message: 'Account locked after 3 failed attempts.' };
          }
          return { success: false, message: `Invalid password. ${3 - newFailedAttempts} attempts left.` };
        }
      }

      // 3. Check Parents from Firestore
      const qParent = query(collection(db, 'parents'), where('email', '==', id));
      const parentSnapshot = await getDocs(qParent);

      if (!parentSnapshot.empty) {
        const parentDoc = parentSnapshot.docs[0];
        const parent = { id: parentDoc.id, ...parentDoc.data() } as any;

        if (parent.password === pass) {
          const mockUser: UserSession = { 
            email: parent.email, 
            uid: parent.id,
            role: 'parent',
            permissions: [],
            assignedClasses: [],
            studentId: parent.studentId
          };
          setUser(mockUser);
          setIsAdmin(false);
          localStorage.setItem('school_erp_user', JSON.stringify(mockUser));
          return { success: true };
        } else {
          return { success: false, message: 'Invalid password.' };
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login.' };
    }

    return { success: false, message: 'User not found.' };
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('school_erp_user');
  };

  const hasPermission = (module: string, level: 'read' | 'write' | 'full' = 'read') => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    if (!user.permissions) return false;
    const perm = user.permissions.find(p => p.module === module);
    if (!perm) return false;

    const levels = { 'none': 0, 'read': 1, 'write': 2, 'full': 3 };
    return levels[perm.access] >= levels[level];
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
