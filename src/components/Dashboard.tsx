import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFees: 0,
    paidFees: 0,
    unpaidFees: 0,
    attendanceToday: 0,
    totalTimetables: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'parent') {
      navigate('/parent/dashboard');
      return;
    }

    const fetchStats = async () => {
      try {
        let studentCount = 0;
        let totalFees = 0;
        let paidFees = 0;
        let unpaidFees = 0;
        let timetableCount = 0;

        try {
          const studentsSnap = await getDocs(collection(db, 'students'));
          studentCount = studentsSnap.size;
        } catch (e) {
          console.warn("Could not fetch students", e);
          handleFirestoreError(e, OperationType.GET, 'students');
        }

        try {
          const timetablesSnap = await getDocs(collection(db, 'timetables'));
          timetableCount = timetablesSnap.size;
        } catch (e) {
          console.warn("Could not fetch timetables", e);
          handleFirestoreError(e, OperationType.GET, 'timetables');
        }

        try {
          const feesSnap = await getDocs(collection(db, 'fees'));
          feesSnap.docs.forEach(doc => {
            const data = doc.data();
            totalFees += data.amount || 0;
            if (data.status === 'Paid') paidFees += data.amount || 0;
            else unpaidFees += data.amount || 0;
          });
        } catch (e) {
          console.warn("Could not fetch fees", e);
          handleFirestoreError(e, OperationType.GET, 'fees');
        }

        setStats({
          totalStudents: studentCount,
          totalFees,
          paidFees,
          unpaidFees,
          attendanceToday: 0, // Placeholder
          totalTimetables: timetableCount
        });
      } catch (error) {
        console.error("Error fetching stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const feeData = [
    { name: 'Paid', value: stats.paidFees, color: '#10B981' },
    { name: 'Unpaid', value: stats.unpaidFees, color: '#EF4444' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
      </div>
      <div className="h-96 bg-gray-200 rounded-xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back to your school management portal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={Users} 
          color="blue" 
          trend="+4%" 
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.totalFees.toLocaleString()}`} 
          icon={CreditCard} 
          color="green" 
          trend="+12%" 
        />
        <StatCard 
          title="Paid Fees" 
          value={`$${stats.paidFees.toLocaleString()}`} 
          icon={TrendingUp} 
          color="emerald" 
          trend="+8%" 
        />
        <StatCard 
          title="Unpaid Fees" 
          value={`$${stats.unpaidFees.toLocaleString()}`} 
          icon={CalendarCheck} 
          color="red" 
          trend="-2%" 
        />
        <StatCard 
          title="Active Timetables" 
          value={stats.totalTimetables} 
          icon={Calendar} 
          color="purple" 
          trend="+2" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Fee Collection Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#F9FAFB'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {feeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activities</h3>
          <div className="space-y-6">
            <ActivityItem 
              title="New Student Admitted" 
              time="2 hours ago" 
              description="John Doe joined Class 10-A"
            />
            <ActivityItem 
              title="Fee Payment Received" 
              time="4 hours ago" 
              description="Sarah Smith paid $500 for March"
            />
            <ActivityItem 
              title="Attendance Marked" 
              time="6 hours ago" 
              description="Class 8-B attendance completed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
          {trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
      </div>
    </div>
  );
};

const ActivityItem = ({ title, time, description }: any) => (
  <div className="flex gap-4">
    <div className="mt-1">
      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
      <div className="w-px h-full bg-gray-100 mx-auto mt-1"></div>
    </div>
    <div>
      <p className="text-sm font-bold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{time}</p>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  </div>
);
