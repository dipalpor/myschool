import React, { useState, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  Smartphone, 
  Users, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  ChevronRight,
  User,
  History
} from 'lucide-react';
import { collection, query, getDocs, addDoc, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Student, Teacher, Parent } from '../types';
import { toast } from 'sonner';

interface SMSLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  status: 'sent' | 'failed';
  timestamp: string;
  type: 'student' | 'teacher' | 'parent';
}

export const Communication: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sms' | 'history'>('sms');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [smsMessage, setSmsMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const qStudents = query(collection(db, 'students'));
      const qTeachers = query(collection(db, 'teachers'));
      const qParents = query(collection(db, 'parents'));

      const [studentSnap, teacherSnap, parentSnap] = await Promise.all([
        getDocs(qStudents),
        getDocs(qTeachers),
        getDocs(qParents)
      ]);

      setStudents(studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
      setTeachers(teacherSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher)));
      setParents(parentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Parent)));
    };

    const qLogs = query(collection(db, 'sms_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setSmsLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SMSLog)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'sms_logs'));

    fetchData();
    return () => unsubLogs();
  }, []);

  const handleSendSMS = async () => {
    if (selectedRecipients.length === 0 || !smsMessage.trim()) {
      toast.error('Please select recipients and enter a message');
      return;
    }

    setLoading(true);
    try {
      const logs = selectedRecipients.map(id => {
        const recipient = [...students, ...teachers, ...parents].find(r => r.id === id);
        return {
          recipientName: recipient?.name || 'Unknown',
          recipientPhone: (recipient as any).contactNumber || (recipient as any).phone || 'N/A',
          message: smsMessage,
          status: 'sent' as const,
          timestamp: new Date().toISOString(),
          type: students.find(s => s.id === id) ? 'student' : teachers.find(t => t.id === id) ? 'teacher' : 'parent'
        };
      });

      for (const log of logs) {
        await addDoc(collection(db, 'sms_logs'), log);
      }

      toast.success(`SMS sent to ${selectedRecipients.length} recipients (Simulated)`);
      setSmsMessage('');
      setSelectedRecipients([]);
    } catch (error) {
      toast.error('Error sending SMS');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const filteredList = [...students, ...teachers, ...parents].filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communication Center</h1>
          <p className="text-gray-500">Send SMS notifications and view communication history</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sms')}
          className={`pb-4 px-4 font-bold text-sm transition-all relative ${
            activeTab === 'sms' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Send SMS
          {activeTab === 'sms' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 px-4 font-bold text-sm transition-all relative ${
            activeTab === 'history' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          SMS History
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'sms' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recipient Selection */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Select Recipients
                </h3>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                  {selectedRecipients.length} Selected
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by name..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredList.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleRecipient(r.id!)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                    selectedRecipients.includes(r.id!) 
                      ? 'bg-blue-50 border-blue-100 border' 
                      : 'hover:bg-gray-50 border-transparent border'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                    students.find(s => s.id === r.id) ? 'bg-green-100 text-green-600' : 
                    teachers.find(t => t.id === r.id) ? 'bg-purple-100 text-purple-600' : 
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400">{(r as any).contactNumber || (r as any).phone || 'No Phone'}</p>
                  </div>
                  {selectedRecipients.includes(r.id!) && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Message Composer */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Compose Message
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">SMS Content</label>
                <textarea 
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
                  placeholder="Type your message here..."
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-gray-400 font-bold">{smsMessage.length} characters</span>
                  <span className="text-[10px] text-gray-400 font-bold">{Math.ceil(smsMessage.length / 160)} SMS Credits</span>
                </div>
              </div>
              <button
                disabled={loading}
                onClick={handleSendSMS}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send SMS Now
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
              <p className="text-xs text-orange-700 leading-relaxed">
                <strong>Note:</strong> This is a simulation. In a production environment, this would integrate with an SMS gateway like Twilio or AWS SNS.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Sent SMS History
            </h3>
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              <Filter className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {smsLogs.length > 0 ? (
                  smsLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            log.type === 'student' ? 'bg-green-100 text-green-600' : 
                            log.type === 'teacher' ? 'bg-purple-100 text-purple-600' : 
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {log.recipientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{log.recipientName}</p>
                            <p className="text-[10px] text-gray-400">{log.recipientPhone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600 max-w-xs truncate" title={log.message}>{log.message}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                      No SMS history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
