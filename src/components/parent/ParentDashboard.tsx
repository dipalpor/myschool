import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../AuthContext';
import { Student, Attendance, Fee, Result, Timetable } from '../../types';
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  ClipboardList, 
  Calendar,
  Clock,
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.studentId) return;

    const fetchData = async () => {
      try {
        // Fetch Student Details
        const studentDoc = await getDoc(doc(db, 'students', user.studentId!));
        if (studentDoc.exists()) {
          const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
          setStudent(studentData);

          // Fetch Timetable for student's class
          const qTimetable = query(
            collection(db, 'timetables'), 
            where('class', '==', studentData.class),
            where('section', '==', studentData.section)
          );
          const timetableSnap = await getDocs(qTimetable);
          if (!timetableSnap.empty) {
            setTimetable({ id: timetableSnap.docs[0].id, ...timetableSnap.docs[0].data() } as Timetable);
          }
        }

        // Real-time Attendance
        const qAttendance = query(collection(db, 'attendance'), where('studentId', '==', user.studentId));
        const unsubAttendance = onSnapshot(qAttendance, (snap) => {
          setAttendance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
        }, (err) => handleFirestoreError(err, OperationType.GET, 'attendance'));

        // Real-time Fees
        const qFees = query(collection(db, 'fees'), where('studentId', '==', user.studentId));
        const unsubFees = onSnapshot(qFees, (snap) => {
          setFees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fee)));
        }, (err) => handleFirestoreError(err, OperationType.GET, 'fees'));

        // Real-time Results
        const qResults = query(collection(db, 'results'), where('studentId', '==', user.studentId));
        const unsubResults = onSnapshot(qResults, (snap) => {
          setResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result)));
        }, (err) => handleFirestoreError(err, OperationType.GET, 'results'));

        setLoading(false);

        return () => {
          unsubAttendance();
          unsubFees();
          unsubResults();
        };
      } catch (error) {
        console.error('Error fetching parent portal data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Student Not Found</h2>
        <p className="text-gray-500">We couldn't find the student record associated with your account.</p>
      </div>
    );
  }

  const attendanceRate = attendance.length > 0 
    ? Math.round((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100)
    : 0;

  const pendingFees = fees.filter(f => f.status === 'Unpaid').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header / Student Profile Summary */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
              <UserIcon className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> Class {student.class}-{student.section}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Roll No: {student.rollNumber}</span>
              <span className="flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{student.status}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{attendanceRate}%</p>
            </div>
            <div className="w-px h-10 bg-gray-100 mx-2"></div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Fees</p>
              <p className="text-2xl font-bold text-red-600">${pendingFees}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Stats & Info */}
        <div className="space-y-8">
          {/* Contact Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <UserIcon className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Parent Name</p>
                  <p className="text-sm text-gray-900 font-medium">{student.parentName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Contact Number</p>
                  <p className="text-sm text-gray-900 font-medium">{student.contactNumber}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Address</p>
                  <p className="text-sm text-gray-900 font-medium">{student.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Today's Schedule
              </h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
            </div>
            <div className="space-y-4">
              {timetable?.entries.filter(e => e.day === new Date().toLocaleDateString('en-US', { weekday: 'long' })).length ? (
                timetable.entries
                  .filter(e => e.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }))
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs font-bold text-gray-900">{entry.startTime}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{entry.endTime}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-100"></div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{entry.subject}</p>
                        <p className="text-xs text-gray-500">{entry.teacherName}</p>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4">No classes scheduled for today.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Results */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                Recent Exam Results
              </h3>
              <button className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.length > 0 ? (
                results.slice(0, 4).map((result) => (
                  <div key={result.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Exam ID: {result.examId.substring(0, 8)}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">Marks: {result.marksObtained}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      result.status === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center py-8 text-gray-500 italic">No exam results available yet.</p>
              )}
            </div>
          </div>

          {/* Fee History */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Recent Fee Records
              </h3>
            </div>
            <div className="overflow-hidden border border-gray-100 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Month/Year</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {fees.length > 0 ? (
                    fees.slice(0, 5).map((fee) => (
                      <tr key={fee.id} className="text-sm hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{fee.month} {fee.year}</td>
                        <td className="px-4 py-3 text-gray-600">${fee.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            fee.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fee.paymentDate || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">No fee records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GraduationCap = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
);
