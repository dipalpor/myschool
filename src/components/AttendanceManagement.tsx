import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Attendance, Student } from '../types';
import { Calendar, CheckCircle, XCircle, Clock, Save, Filter } from 'lucide-react';
import { toast } from 'sonner';

export const AttendanceManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('All');
  const [markingAttendance, setMarkingAttendance] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const snap = await getDocs(collection(db, 'students'));
        const studentList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(studentList);
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'students');
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'attendance'), where('date', '==', selectedDate));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attendanceList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
      setAttendance(attendanceList);
      
      // Pre-fill marking state if attendance already exists for this date
      const initialMarking: Record<string, 'Present' | 'Absent' | 'Late'> = {};
      attendanceList.forEach(a => {
        initialMarking[a.studentId] = a.status;
      });
      setMarkingAttendance(initialMarking);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance');
    });

    return () => unsubscribe();
  }, [selectedDate]);

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    setMarkingAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    try {
      const promises = Object.entries(markingAttendance).map(async ([studentId, status]) => {
        // Check if record already exists to avoid duplicates (simplified for this demo)
        // In a real app, you'd update existing records
        const existing = attendance.find(a => a.studentId === studentId);
        if (!existing) {
          await addDoc(collection(db, 'attendance'), {
            studentId,
            date: selectedDate,
            status,
            class: students.find(s => s.id === studentId)?.class || ''
          });
        }
      });

      await Promise.all(promises);
      toast.success('Attendance saved successfully');
    } catch (error) {
      toast.error('Error saving attendance');
    }
  };

  const classes = Array.from(new Set(students.map(s => s.class)));
  const filteredStudents = students.filter(s => selectedClass === 'All' || s.class === selectedClass);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500">Mark and view daily student attendance records.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button
            onClick={saveAttendance}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Save className="w-5 h-5" />
            Save Attendance
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="All">All Classes</option>
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm font-medium uppercase tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1,2,3].map(i => <tr key={i} className="animate-pulse h-16 bg-gray-50/50"><td colSpan={4}></td></tr>)
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.rollNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.class}-{student.section}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => handleStatusChange(student.id, 'Present')}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                            markingAttendance[student.id] === 'Present' 
                              ? 'bg-green-100 text-green-600 ring-2 ring-green-500' 
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <CheckCircle className="w-6 h-6" />
                          <span className="text-[10px] font-bold uppercase">Present</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'Absent')}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                            markingAttendance[student.id] === 'Absent' 
                              ? 'bg-red-100 text-red-600 ring-2 ring-red-500' 
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <XCircle className="w-6 h-6" />
                          <span className="text-[10px] font-bold uppercase">Absent</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'Late')}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                            markingAttendance[student.id] === 'Late' 
                              ? 'bg-yellow-100 text-yellow-600 ring-2 ring-yellow-500' 
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <Clock className="w-6 h-6" />
                          <span className="text-[10px] font-bold uppercase">Late</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No students found for this class.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
