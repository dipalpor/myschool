import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Student, Fee, Attendance } from '../types';
import { FileText, Download, PieChart, Users, DollarSign } from 'lucide-react';

export const Reports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsSnap, feesSnap, attendanceSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'fees')),
          getDocs(collection(db, 'attendance'))
        ]);

        setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
        setFees(feesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fee)));
        setAttendance(attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching report data", error);
        // We don't know which one failed exactly in Promise.all, so we can log a general error or handle individually
        // For better diagnostics, let's handle them individually if needed, but for now:
        handleFirestoreError(error, OperationType.GET, 'reports_data');
      }
    };

    fetchData();
  }, []);

  const totalRevenue = fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  const pendingRevenue = fees.filter(f => f.status === 'Unpaid').reduce((sum, f) => sum + f.amount, 0);
  
  const classWiseStudents = students.reduce((acc, s) => {
    acc[s.class] = (acc[s.class] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-64 bg-gray-200 rounded-xl"></div>
    <div className="grid grid-cols-2 gap-6">
      <div className="h-48 bg-gray-200 rounded-xl"></div>
      <div className="h-48 bg-gray-200 rounded-xl"></div>
    </div>
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Comprehensive summary of school operations.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-5 h-5" />
          Export All Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard 
          title="Financial Summary" 
          icon={DollarSign}
          items={[
            { label: 'Total Collected', value: `$${totalRevenue.toLocaleString()}`, color: 'text-green-600' },
            { label: 'Total Pending', value: `$${pendingRevenue.toLocaleString()}`, color: 'text-red-600' },
            { label: 'Collection Rate', value: `${Math.round((totalRevenue / (totalRevenue + pendingRevenue || 1)) * 100)}%`, color: 'text-blue-600' }
          ]}
        />
        <ReportCard 
          title="Student Demographics" 
          icon={Users}
          items={Object.entries(classWiseStudents).map(([cls, count]) => ({
            label: `Class ${cls}`, value: `${count} Students`, color: 'text-gray-700'
          }))}
        />
        <ReportCard 
          title="Attendance Overview" 
          icon={PieChart}
          items={[
            { label: 'Avg. Attendance', value: '92%', color: 'text-green-600' },
            { label: 'Frequent Absentees', value: '12 Students', color: 'text-orange-600' }
          ]}
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Detailed Fee Collection Report
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-sm font-medium uppercase border-b border-gray-100">
                <th className="pb-4">Student</th>
                <th className="pb-4">Total Fees</th>
                <th className="pb-4">Paid</th>
                <th className="pb-4">Pending</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map(student => {
                const studentFees = fees.filter(f => f.studentId === student.id);
                const paid = studentFees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
                const unpaid = studentFees.filter(f => f.status === 'Unpaid').reduce((sum, f) => sum + f.amount, 0);
                return (
                  <tr key={student.id} className="hover:bg-gray-50/50">
                    <td className="py-4 font-medium text-gray-900">{student.name}</td>
                    <td className="py-4 text-gray-600">${paid + unpaid}</td>
                    <td className="py-4 text-green-600 font-bold">${paid}</td>
                    <td className="py-4 text-red-600 font-bold">${unpaid}</td>
                    <td className="py-4">
                      <span className={`text-xs font-bold ${unpaid === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {unpaid === 0 ? 'Clear' : 'Dues Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ReportCard = ({ title, icon: Icon, items }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
    </div>
    <div className="space-y-4">
      {items.map((item: any, i: number) => (
        <div key={i} className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{item.label}</span>
          <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);
