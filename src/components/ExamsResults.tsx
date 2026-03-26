import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  ChevronRight,
  User,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Exam, Result, Student } from '../types';
import { toast } from 'sonner';

export const ExamsResults: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exams' | 'results'>('exams');
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [showExamModal, setShowExamModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editingResult, setEditingResult] = useState<Result | null>(null);

  const [examForm, setExamForm] = useState<Partial<Exam>>({
    title: '',
    class: '',
    subject: '',
    date: '',
    maxMarks: 100,
    passingMarks: 33,
  });

  const [resultForm, setResultForm] = useState<Partial<Result>>({
    studentId: '',
    marksObtained: 0,
  });

  useEffect(() => {
    const qExams = query(collection(db, 'exams'));
    const unsubscribeExams = onSnapshot(qExams, (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'exams');
    });

    const qResults = query(collection(db, 'results'));
    const unsubscribeResults = onSnapshot(qResults, (snapshot) => {
      setResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'results');
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
    return () => {
      unsubscribeExams();
      unsubscribeResults();
    };
  }, []);

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExam) {
        await updateDoc(doc(db, 'exams', editingExam.id), examForm);
        toast.success('Exam updated successfully');
      } else {
        await addDoc(collection(db, 'exams'), examForm);
        toast.success('Exam added successfully');
      }
      setShowExamModal(false);
      setEditingExam(null);
      setExamForm({ title: '', class: '', subject: '', date: '', maxMarks: 100, passingMarks: 33 });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'exams');
      toast.error('Error saving exam');
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this exam? All associated results will also be deleted.')) {
      try {
        await deleteDoc(doc(db, 'exams', id));
        // Also delete associated results
        const associatedResults = results.filter(r => r.examId === id);
        await Promise.all(associatedResults.map(r => deleteDoc(doc(db, 'results', r.id))));
        toast.success('Exam and associated results deleted successfully');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'exams');
        toast.error('Error deleting exam');
      }
    }
  };

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    const student = students.find(s => s.id === resultForm.studentId);
    if (!student) return;

    const status = (resultForm.marksObtained || 0) >= selectedExam.passingMarks ? 'Pass' : 'Fail';

    try {
      const resultData = {
        ...resultForm,
        examId: selectedExam.id,
        status,
        studentName: student.name,
        rollNumber: student.rollNumber
      };

      if (editingResult) {
        await updateDoc(doc(db, 'results', editingResult.id), resultData);
        toast.success('Result updated successfully');
      } else {
        await addDoc(collection(db, 'results'), resultData);
        toast.success('Result added successfully');
      }
      setShowResultModal(false);
      setEditingResult(null);
      setResultForm({ studentId: '', marksObtained: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'results');
      toast.error('Error saving result');
    }
  };

  const handleDeleteResult = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this result?')) {
      try {
        await deleteDoc(doc(db, 'results', id));
        toast.success('Result deleted successfully');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'results');
        toast.error('Error deleting result');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams & Results</h1>
          <p className="text-gray-500">Manage school examinations and student performance</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'exams' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Exams
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'results' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Results
            </button>
          </div>
          {activeTab === 'exams' && (
            <button
              onClick={() => {
                setEditingExam(null);
                setExamForm({ title: '', class: '', subject: '', date: '', maxMarks: 100, passingMarks: 33 });
                setShowExamModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
            >
              <Plus className="w-4 h-4" />
              Add Exam
            </button>
          )}
        </div>
      </div>

      {activeTab === 'exams' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingExam(exam);
                        setExamForm(exam);
                        setShowExamModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{exam.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{exam.subject} - Class {exam.class}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(exam.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>Max Marks: {exam.maxMarks} | Passing: {exam.passingMarks}</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Performance</span>
                <button 
                  onClick={() => {
                    setSelectedExam(exam);
                    setActiveTab('results');
                  }}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View Results
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-gray-700">Select Exam:</label>
              <select 
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                value={selectedExam?.id || ''}
                onChange={(e) => setSelectedExam(exams.find(ex => ex.id === e.target.value) || null)}
              >
                <option value="">Choose an exam...</option>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.title} - {ex.subject} (Class {ex.class})</option>
                ))}
              </select>
            </div>
            {selectedExam && (
              <button
                onClick={() => {
                  setEditingResult(null);
                  setResultForm({ studentId: '', marksObtained: 0 });
                  setShowResultModal(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                <Plus className="w-4 h-4" />
                Add Result
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Marks Obtained</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Max Marks</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedExam ? (
                  results.filter(r => r.examId === selectedExam.id).map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-gray-900">{result.studentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{result.rollNumber}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{result.marksObtained}</td>
                      <td className="px-6 py-4 text-gray-500">{selectedExam.maxMarks}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          result.status === 'Pass' 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {result.status === 'Pass' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {result.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingResult(result);
                              setResultForm({ studentId: result.studentId, marksObtained: result.marksObtained });
                              setShowResultModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteResult(result.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
                      Please select an exam to view results
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">{editingExam ? 'Edit Exam' : 'Add New Exam'}</h2>
              <p className="text-sm text-gray-500">Fill in the examination details</p>
            </div>
            <form onSubmit={handleAddExam} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Exam Title</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Mid Term Exam"
                    value={examForm.title}
                    onChange={e => setExamForm({ ...examForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Class</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 10"
                    value={examForm.class}
                    onChange={e => setExamForm({ ...examForm, class: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Mathematics"
                    value={examForm.subject}
                    onChange={e => setExamForm({ ...examForm, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={examForm.date}
                    onChange={e => setExamForm({ ...examForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Max Marks</label>
                  <input
                    required
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={examForm.maxMarks}
                    onChange={e => setExamForm({ ...examForm, maxMarks: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Passing Marks</label>
                  <input
                    required
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={examForm.passingMarks}
                    onChange={e => setExamForm({ ...examForm, passingMarks: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                >
                  {editingExam ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">{editingResult ? 'Edit Result' : 'Add New Result'}</h2>
              <p className="text-sm text-gray-500">Enter marks for {selectedExam?.title}</p>
            </div>
            <form onSubmit={handleAddResult} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Student</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={resultForm.studentId}
                  onChange={e => setResultForm({ ...resultForm, studentId: e.target.value })}
                  disabled={!!editingResult}
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Marks Obtained</label>
                <input
                  required
                  type="number"
                  max={selectedExam?.maxMarks}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={resultForm.marksObtained}
                  onChange={e => setResultForm({ ...resultForm, marksObtained: parseInt(e.target.value) })}
                />
                <p className="mt-1 text-xs text-gray-500">Max marks: {selectedExam?.maxMarks} | Passing: {selectedExam?.passingMarks}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                >
                  {editingResult ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
