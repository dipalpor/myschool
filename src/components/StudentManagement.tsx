import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Student } from '../types';
import { Plus, Search, Edit2, Trash2, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    rollNumber: string;
    class: string;
    section: string;
    parentName: string;
    contactNumber: string;
    address: string;
    admissionDate: string;
    status: 'Active' | 'Inactive';
  }>({
    name: '',
    rollNumber: '',
    class: '',
    section: '',
    parentName: '',
    contactNumber: '',
    address: '',
    admissionDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'students');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateDoc(doc(db, 'students', editingStudent.id), formData);
        toast.success('Student updated successfully');
      } else {
        await addDoc(collection(db, 'students'), formData);
        toast.success('Student added successfully');
      }
      closeModal();
    } catch (error) {
      toast.error('Error saving student');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteDoc(doc(db, 'students', id));
        toast.success('Student deleted successfully');
      } catch (error) {
        toast.error('Error deleting student');
      }
    }
  };

  const openModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        rollNumber: student.rollNumber,
        class: student.class,
        section: student.section,
        parentName: student.parentName,
        contactNumber: student.contactNumber,
        address: student.address,
        admissionDate: student.admissionDate,
        status: student.status
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        rollNumber: '',
        class: '',
        section: '',
        parentName: '',
        contactNumber: '',
        address: '',
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.includes(searchTerm) ||
    s.class.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-500">Manage student records, admissions, and details.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add New Student
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll no, or class..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm font-medium uppercase tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Parent Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/50"></td>
                  </tr>
                ))
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.contactNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{student.rollNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{student.class} - {student.section}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.parentName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        student.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No students found matching your search.
                  </td>
                </tr>
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
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
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
                  <label className="text-sm font-bold text-gray-700">Roll Number</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Class</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.class}
                    onChange={(e) => setFormData({...formData, class: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Section</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Parent Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.parentName}
                    onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Contact Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Address</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Admission Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({...formData, admissionDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Status</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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
                  {editingStudent ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
