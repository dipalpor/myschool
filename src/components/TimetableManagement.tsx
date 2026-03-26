import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Timetable, TimetableEntry, Teacher } from '../types';
import { Plus, Search, Calendar, Clock, User, MapPin, Trash2, Edit2, X, Save, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const TimetableManagement: React.FC = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<{
    class: string;
    section: string;
    entries: TimetableEntry[];
  }>({
    class: '',
    section: '',
    entries: []
  });

  const [newEntry, setNewEntry] = useState<TimetableEntry>({
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    subject: '',
    teacherId: '',
    teacherName: '',
    room: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'timetables'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTimetables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'timetables');
    });

    const fetchTeachers = async () => {
      try {
        const snap = await getDocs(collection(db, 'teachers'));
        setTeachers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher)));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'teachers');
      }
    };

    fetchTeachers();
    return () => unsubscribe();
  }, []);

  const handleAddEntry = () => {
    if (!newEntry.subject || !newEntry.teacherId) {
      toast.error('Please fill in subject and teacher');
      return;
    }
    const teacher = teachers.find(t => t.id === newEntry.teacherId);
    const entryWithTeacherName = { ...newEntry, teacherName: teacher?.name || '' };
    setFormData({
      ...formData,
      entries: [...formData.entries, entryWithTeacherName]
    });
    setNewEntry({
      day: 'Monday',
      startTime: '08:00',
      endTime: '09:00',
      subject: '',
      teacherId: '',
      teacherName: '',
      room: ''
    });
  };

  const removeEntry = (index: number) => {
    setFormData({
      ...formData,
      entries: formData.entries.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.entries.length === 0) {
      toast.error('Please add at least one entry to the timetable');
      return;
    }

    try {
      const data = {
        ...formData,
        lastUpdated: new Date().toISOString()
      };

      if (editingTimetable) {
        await updateDoc(doc(db, 'timetables', editingTimetable.id), data);
        toast.success('Timetable updated successfully');
      } else {
        await addDoc(collection(db, 'timetables'), data);
        toast.success('Timetable created successfully');
      }
      closeModal();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'timetables');
      toast.error('Error saving timetable');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this timetable?')) {
      try {
        await deleteDoc(doc(db, 'timetables', id));
        toast.success('Timetable deleted successfully');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'timetables');
        toast.error('Error deleting timetable');
      }
    }
  };

  const openModal = (timetable?: Timetable) => {
    if (timetable) {
      setEditingTimetable(timetable);
      setFormData({
        class: timetable.class,
        section: timetable.section,
        entries: timetable.entries
      });
    } else {
      setEditingTimetable(null);
      setFormData({ class: '', section: '', entries: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTimetable(null);
    setFormData({ class: '', section: '', entries: [] });
  };

  const filteredTimetables = timetables.filter(t => 
    t.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
          <p className="text-gray-500">Create and manage class schedules and teacher assignments.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create Timetable
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by class or section..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-50 animate-pulse rounded-2xl"></div>)
          ) : filteredTimetables.length > 0 ? (
            filteredTimetables.map((t) => (
              <div key={t.id} className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-blue-100 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Class {t.class} - {t.section}</h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated: {new Date(t.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total Periods</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{t.entries.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(t.entries.map(e => e.day))).map(day => (
                      <span key={day} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {day.substring(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => openModal(t)}
                  className="mt-6 w-full py-2 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  View Full Schedule
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500">
              No timetables found. Create one to get started.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingTimetable ? 'Edit Timetable' : 'Create Timetable'}
                  </h2>
                  <p className="text-xs text-gray-500">Define class schedule and teacher assignments</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Class</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., 10"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    value={formData.class}
                    onChange={(e) => setFormData({...formData, class: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Section</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., A"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  Add New Period
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Day</label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newEntry.day}
                      onChange={(e) => setNewEntry({...newEntry, day: e.target.value as any})}
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Start Time</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newEntry.startTime}
                      onChange={(e) => setNewEntry({...newEntry, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">End Time</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newEntry.endTime}
                      onChange={(e) => setNewEntry({...newEntry, endTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g., Math"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newEntry.subject}
                      onChange={(e) => setNewEntry({...newEntry, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Teacher</label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newEntry.teacherId}
                      onChange={(e) => setNewEntry({...newEntry, teacherId: e.target.value})}
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Room (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., 101"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newEntry.room}
                      onChange={(e) => setNewEntry({...newEntry, room: e.target.value})}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddEntry}
                      className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                    >
                      Add Period
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Schedule Preview
                </h3>
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Day</th>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Teacher</th>
                        <th className="px-4 py-3">Room</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {formData.entries.length > 0 ? (
                        formData.entries.sort((a, b) => {
                          const dayOrder = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
                          if (dayOrder !== 0) return dayOrder;
                          return a.startTime.localeCompare(b.startTime);
                        }).map((entry, idx) => (
                          <tr key={idx} className="text-sm hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-gray-900">{entry.day}</td>
                            <td className="px-4 py-3 text-gray-600">{entry.startTime} - {entry.endTime}</td>
                            <td className="px-4 py-3 font-medium text-blue-600">{entry.subject}</td>
                            <td className="px-4 py-3 text-gray-600">{entry.teacherName}</td>
                            <td className="px-4 py-3 text-gray-500">{entry.room || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeEntry(idx)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                            No periods added yet. Use the form above to build the schedule.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingTimetable ? 'Update Timetable' : 'Save Timetable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
