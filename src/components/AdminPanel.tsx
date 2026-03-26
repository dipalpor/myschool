import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  UserPlus, 
  Key, 
  Lock, 
  Unlock, 
  Settings, 
  CheckCircle2, 
  XCircle,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  ShieldAlert,
  Users as UsersIcon,
  Plus
} from 'lucide-react';
import { collection, onSnapshot, query, updateDoc, doc, addDoc, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Teacher, Permission, Parent, Student } from '../types';
import { toast } from 'sonner';

const MODULES: Permission['module'][] = ['students', 'teachers', 'fees', 'attendance', 'exams', 'reports', 'admin'];
const ACCESS_LEVELS: Permission['access'][] = ['none', 'read', 'write', 'full'];

export const AdminPanel: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'teachers' | 'parents'>('teachers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [newParent, setNewParent] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    contactNumber: ''
  });

  useEffect(() => {
    const qTeachers = query(collection(db, 'teachers'));
    const unsubTeachers = onSnapshot(qTeachers, (snapshot) => {
      setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'teachers'));

    const qParents = query(collection(db, 'parents'));
    const unsubParents = onSnapshot(qParents, (snapshot) => {
      setParents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Parent)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'parents'));

    const fetchStudents = async () => {
      const qStudents = query(collection(db, 'students'));
      const snap = await getDocs(qStudents);
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    };
    fetchStudents();

    return () => {
      unsubTeachers();
      unsubParents();
    };
  }, []);

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newParent.studentId) {
        toast.error('Please select a student');
        return;
      }
      await addDoc(collection(db, 'parents'), {
        ...newParent,
        role: 'parent',
        status: 'active',
        createdAt: new Date().toISOString()
      });
      toast.success('Parent account created successfully');
      setShowAddParentModal(false);
      setNewParent({ name: '', email: '', password: '', studentId: '', contactNumber: '' });
    } catch (error) {
      toast.error('Error creating parent account');
    }
  };

  const handleResetPassword = async (teacherId: string) => {
    const newPassword = Math.random().toString(36).slice(-8);
    try {
      await updateDoc(doc(db, 'teachers', teacherId), { 
        password: newPassword, 
        failedAttempts: 0, 
        status: 'active' 
      });
      toast.success(`Password reset to: ${newPassword}`, { duration: 10000 });
    } catch (error) {
      toast.error('Error resetting password');
    }
  };

  const handleToggleStatus = async (teacherId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'locked' : 'active';
      await updateDoc(doc(db, 'teachers', teacherId), { 
        status: newStatus, 
        failedAttempts: 0 
      });
      toast.success('Teacher status updated');
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const handleUpdatePermissions = async (teacherId: string, permissions: Permission[]) => {
    try {
      await updateDoc(doc(db, 'teachers', teacherId), { permissions });
      toast.success('Permissions updated');
    } catch (error) {
      toast.error('Error updating permissions');
    }
  };

  const handleUpdateRole = async (teacherId: string, role: 'admin' | 'teacher') => {
    try {
      await updateDoc(doc(db, 'teachers', teacherId), { role });
      toast.success(`Role updated to ${role}`);
    } catch (error) {
      toast.error('Error updating role');
    }
  };

  const handleUpdateClasses = async (teacherId: string, assignedClasses: string[]) => {
    try {
      await updateDoc(doc(db, 'teachers', teacherId), { assignedClasses });
      toast.success('Assigned classes updated');
    } catch (error) {
      toast.error('Error updating classes');
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredParents = parents.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-500">Manage credentials, permissions, and access control</p>
        </div>
        {activeTab === 'parents' && (
          <button 
            onClick={() => setShowAddParentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            Add Parent Account
          </button>
        )}
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('teachers')}
          className={`pb-4 px-4 font-bold text-sm transition-all relative ${
            activeTab === 'teachers' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Teachers
          {activeTab === 'teachers' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('parents')}
          className={`pb-4 px-4 font-bold text-sm transition-all relative ${
            activeTab === 'parents' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Parents
          {activeTab === 'parents' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'teachers' ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Attempts</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          teacher.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{teacher.name}</p>
                          <p className="text-xs text-gray-500">{teacher.subject}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{teacher.username}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        teacher.role === 'admin' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {teacher.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {teacher.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        teacher.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {teacher.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {teacher.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i <= teacher.failedAttempts ? 'bg-red-500' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowSettingsModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Permissions & Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(teacher.id)}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(teacher.id, teacher.status)}
                          className={`p-2 rounded-lg transition-all ${
                            teacher.status === 'active' 
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                              : 'text-red-600 bg-red-50 hover:bg-red-100'
                          }`}
                          title={teacher.status === 'active' ? 'Lock Account' : 'Unlock Account'}
                        >
                          {teacher.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredParents.map((parent) => {
                  const student = students.find(s => s.id === parent.studentId);
                  return (
                    <tr key={parent.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                            {parent.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{parent.name}</p>
                            <p className="text-xs text-gray-500">{parent.contactNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{parent.email}</td>
                      <td className="px-6 py-4">
                        {student ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">Class {student.class}-{student.section}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-red-500 italic">Not Linked</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          parent.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {parent.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          {parent.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={async () => {
                              const newPassword = Math.random().toString(36).slice(-8);
                              await updateDoc(doc(db, 'parents', parent.id!), { password: newPassword });
                              toast.success(`Password reset to: ${newPassword}`, { duration: 10000 });
                            }}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Parent Modal */}
      {showAddParentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Create Parent Account</h2>
              <button onClick={() => setShowAddParentModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddParent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Parent Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newParent.name}
                  onChange={(e) => setNewParent({ ...newParent, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newParent.email}
                  onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newParent.password}
                  onChange={(e) => setNewParent({ ...newParent, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Contact Number</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newParent.contactNumber}
                  onChange={(e) => setNewParent({ ...newParent, contactNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Link to Student</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newParent.studentId}
                  onChange={(e) => setNewParent({ ...newParent, studentId: e.target.value })}
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Class {s.class}-{s.section})</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settings & Permissions Modal */}
      {showSettingsModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Access Control: {selectedTeacher.name}</h2>
                <p className="text-sm text-gray-500">Configure module-level permissions and roles</p>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Role Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Account Role</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={async () => {
                      await handleUpdateRole(selectedTeacher.id, 'teacher');
                      setSelectedTeacher({ ...selectedTeacher, role: 'teacher' });
                    }}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedTeacher.role === 'teacher' 
                        ? 'border-blue-600 bg-blue-50 text-blue-600' 
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    <UserCheck className="w-5 h-5" />
                    <span className="font-bold">Teacher</span>
                  </button>
                  <button
                    onClick={async () => {
                      await handleUpdateRole(selectedTeacher.id, 'admin');
                      setSelectedTeacher({ ...selectedTeacher, role: 'admin' });
                    }}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedTeacher.role === 'admin' 
                        ? 'border-purple-600 bg-purple-50 text-purple-600' 
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5" />
                    <span className="font-bold">Admin</span>
                  </button>
                </div>
              </div>

              {/* Module Permissions */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Module Permissions</h3>
                <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 font-bold text-gray-600">Module</th>
                        {ACCESS_LEVELS.map(level => (
                          <th key={level} className="px-4 py-2 font-bold text-gray-600 text-center capitalize">{level}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {MODULES.map(module => {
                        const currentPerm = selectedTeacher.permissions?.find(p => p.module === module)?.access || 'none';
                        return (
                          <tr key={module}>
                            <td className="px-4 py-3 font-medium text-gray-700 capitalize">{module}</td>
                            {ACCESS_LEVELS.map(level => (
                              <td key={level} className="px-4 py-3 text-center">
                                <input
                                  type="radio"
                                  name={`perm-${module}`}
                                  checked={currentPerm === level}
                                  onChange={async () => {
                                    const newPerms = [...(selectedTeacher.permissions || [])];
                                    const idx = newPerms.findIndex(p => p.module === module);
                                    if (idx !== -1) {
                                      newPerms[idx] = { module, access: level };
                                    } else {
                                      newPerms.push({ module, access: level });
                                    }
                                    await handleUpdatePermissions(selectedTeacher.id, newPerms);
                                    setSelectedTeacher({ ...selectedTeacher, permissions: newPerms });
                                  }}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assigned Classes */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Assigned Classes & Sections</h3>
                <div className="flex flex-wrap gap-2">
                  {['10-A', '10-B', '9-A', '9-B', '8-A', '8-B'].map(cls => (
                    <button
                      key={cls}
                      onClick={async () => {
                        const currentClasses = selectedTeacher.assignedClasses || [];
                        const newClasses = currentClasses.includes(cls)
                          ? currentClasses.filter(c => c !== cls)
                          : [...currentClasses, cls];
                        await handleUpdateClasses(selectedTeacher.id, newClasses);
                        setSelectedTeacher({ ...selectedTeacher, assignedClasses: newClasses });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        (selectedTeacher.assignedClasses || []).includes(cls)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
