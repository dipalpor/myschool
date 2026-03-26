import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Trash2,
  Send,
  Users,
  User,
  Shield
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../AuthContext';
import { Notification } from '../types';
import { toast } from 'sonner';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as Notification['type'],
    recipientRole: 'all' as Notification['recipientRole'],
    recipientId: 'all'
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      
      // Filter notifications based on recipientId and recipientRole
      const filtered = allNotifications.filter(n => 
        n.recipientId === 'all' || 
        n.recipientId === user.uid || 
        n.recipientRole === 'all' || 
        n.recipientRole === user.role
      );

      setNotifications(filtered);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'notifications'));

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.readBy?.includes(user?.uid || '')).length;

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.readBy?.includes(user.uid)) {
        const newReadBy = [...(notification.readBy || []), user.uid];
        await updateDoc(doc(db, 'notifications', notificationId), { readBy: newReadBy });
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'notifications'), {
        ...newNotification,
        createdAt: new Date().toISOString(),
        readBy: []
      });
      toast.success('Notification sent successfully');
      setShowSendModal(false);
      setNewNotification({ title: '', message: '', type: 'info', recipientRole: 'all', recipientId: 'all' });
    } catch (error) {
      toast.error('Error sending notification');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Error deleting notification');
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <div className="flex gap-2">
                {isAdmin && (
                  <button 
                    onClick={() => {
                      setShowSendModal(true);
                      setIsOpen(false);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Send Notification"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors relative group ${
                      !n.readBy?.includes(user?.uid || '') ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">{getTypeIcon(n.type)}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                          <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            {n.recipientRole === 'all' ? <Users className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                            {n.recipientRole}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(n.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 italic text-sm">
                  No notifications found.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Send Notification</h2>
              <button onClick={() => setShowSendModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSendNotification} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="e.g., School Holiday"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Message</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="Enter notification details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Type</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Recipient Role</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={newNotification.recipientRole}
                    onChange={(e) => setNewNotification({ ...newNotification, recipientRole: e.target.value as any })}
                  >
                    <option value="all">All</option>
                    <option value="teacher">Teachers</option>
                    <option value="parent">Parents</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Send Notification
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
