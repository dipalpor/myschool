import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Fee, Student } from '../types';
import { Plus, Search, CreditCard, CheckCircle, XCircle, Filter, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export const FeeManagement: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Unpaid'>('All');

  const [formData, setFormData] = useState<{
    studentId: string;
    amount: number;
    month: string;
    year: number;
    status: 'Paid' | 'Unpaid';
  }>({
    studentId: '',
    amount: 0,
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    status: 'Unpaid'
  });

  useEffect(() => {
    const qFees = query(collection(db, 'fees'));
    const unsubscribeFees = onSnapshot(qFees, (snapshot) => {
      const feeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fee));
      setFees(feeList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'fees');
    });

    const fetchStudents = async () => {
      try {
        const snap = await getDocs(collection(db, 'students'));
        setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'students');
      }
    };

    fetchStudents();
    return () => unsubscribeFees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const student = students.find(s => s.id === formData.studentId);
      if (!student) return;

      await addDoc(collection(db, 'fees'), {
        ...formData,
        studentName: student.name,
        paymentDate: formData.status === 'Paid' ? new Date().toISOString().split('T')[0] : null
      });
      toast.success('Fee record added successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Error adding fee record');
    }
  };

  const toggleStatus = async (fee: Fee) => {
    try {
      const newStatus = fee.status === 'Paid' ? 'Unpaid' : 'Paid';
      await updateDoc(doc(db, 'fees', fee.id), {
        status: newStatus,
        paymentDate: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : null
      });
      toast.success(`Fee marked as ${newStatus}`);
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const filteredFees = fees.filter(f => {
    const matchesSearch = f.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || f.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-500">Track student payments, dues, and collection history.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Fee Record
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm font-medium uppercase tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Month/Year</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1,2,3].map(i => <tr key={i} className="animate-pulse h-16 bg-gray-50/50"><td colSpan={6}></td></tr>)
              ) : filteredFees.length > 0 ? (
                filteredFees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{fee.studentName}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-700">${fee.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{fee.month} {fee.year}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        fee.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {fee.status === 'Paid' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {fee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{fee.paymentDate || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(fee)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          fee.status === 'Paid' 
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {fee.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No fee records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Add Fee Record</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Select Student</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                >
                  <option value="">Choose a student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Amount ($)</label>
                <input
                  required
                  type="number"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Month</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Year</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Status</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'Paid' | 'Unpaid'})}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
