import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Teacher } from '../types';
import { Plus, Search, Edit2, Trash2, X, UserPlus, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    salary: 0,
    joiningDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const q = query(collection(db, 'teachers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teacherList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
      setTeachers(teacherList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'teachers');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await updateDoc(doc(db, 'teachers', editingTeacher.id), formData);
        toast.success('Teacher updated successfully');
      } else {
        // Generate default credentials for new teacher
        const username = formData.name.toLowerCase().replace(/\s+/g, '') + Math.floor(1000 + Math.random() * 9000);
        const password = 'Pass' + Math.floor(1000 + Math.random() * 9000);
        
        const newTeacherData = {
          ...formData,
          username,
          password,
          role: 'teacher',
          status: 'active',
          failedAttempts: 0,
          permissions: [
            { module: 'students', access: 'read' },
            { module: 'attendance', access: 'full' },
            { module: 'exams', access: 'read' }
          ],
          assignedClasses: []
        };
        
        await addDoc(collection(db, 'teachers'), newTeacherData);
        toast.success(`Teacher added! ID: ${username}, Pass: ${password}`, { duration: 10000 });
      }
      closeModal();
    } catch (error) {
      toast.error('Error saving teacher');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await deleteDoc(doc(db, 'teachers', id));
        toast.success('Teacher deleted successfully');
      } catch (error) {
        toast.error('Error deleting teacher');
      }
    }
  };

  const openModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        subject: teacher.subject,
        salary: teacher.salary,
        joiningDate: teacher.joiningDate
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        salary: 0,
        joiningDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-gray-500">Manage faculty records, subjects, and salaries.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add New Teacher
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or subject..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm font-medium uppercase tracking-wider">
                <th className="px-6 py-4">Teacher</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Salary</th>
                <th className="px-6 py-4">Joining Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1,2].map(i => <tr key={i} className="animate-pulse h-16 bg-gray-50/50"><td colSpan={6}></td></tr>)
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {teacher.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{teacher.name}</p>
                          <p className="text-xs text-gray-500">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{teacher.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.phone}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">${teacher.salary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{teacher.joiningDate}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(teacher)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(teacher.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No teachers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Full Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Email Address</label>
                  <input
                    required
                    type="email"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Phone Number</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Subject</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Monthly Salary ($)</label>
                  <input
                    required
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Joining Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {editingTeacher ? 'Update Teacher' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
