import React, { useState } from 'react';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Database, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const SeedData: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const seedDatabase = async () => {
    setIsSeeding(true);
    try {
      // Check if data already exists to avoid duplicates (optional, but safer)
      const studentsCheck = await getDocs(query(collection(db, 'students'), limit(1)));
      if (!studentsCheck.empty) {
        if (!window.confirm('Data already exists. Do you want to add more dummy data?')) {
          setIsSeeding(false);
          return;
        }
      }

      // 1. Add Students
      const students = [
        { name: 'John Doe', rollNumber: 'S001', class: '10', section: 'A', parentName: 'Robert Doe', contactNumber: '1234567890', address: '123 Main St', admissionDate: '2024-01-15', status: 'Active' },
        { name: 'Jane Smith', rollNumber: 'S002', class: '10', section: 'B', parentName: 'Mary Smith', contactNumber: '0987654321', address: '456 Oak Ave', admissionDate: '2024-02-10', status: 'Active' },
        { name: 'Alice Johnson', rollNumber: 'S003', class: '9', section: 'A', parentName: 'David Johnson', contactNumber: '1122334455', address: '789 Pine Rd', admissionDate: '2024-03-05', status: 'Active' },
        { name: 'Bob Wilson', rollNumber: 'S004', class: '8', section: 'C', parentName: 'James Wilson', contactNumber: '5566778899', address: '321 Elm St', admissionDate: '2024-01-20', status: 'Active' },
        { name: 'Emma Brown', rollNumber: 'S005', class: '11', section: 'A', parentName: 'Michael Brown', contactNumber: '9988776655', address: '654 Maple Dr', admissionDate: '2024-02-25', status: 'Active' },
      ];

      const studentIds: string[] = [];
      for (const student of students) {
        const docRef = await addDoc(collection(db, 'students'), student);
        studentIds.push(docRef.id);
      }

      // 2. Add Teachers
      const teachers = [
        { name: 'Dr. Sarah Miller', email: 'sarah.m@school.erp', phone: '555-0101', subject: 'Mathematics', salary: 5500, joiningDate: '2020-08-15' },
        { name: 'Prof. James Wilson', email: 'j.wilson@school.erp', phone: '555-0102', subject: 'Physics', salary: 6000, joiningDate: '2019-09-01' },
        { name: 'Ms. Emily Davis', email: 'emily.d@school.erp', phone: '555-0103', subject: 'English', salary: 4800, joiningDate: '2021-01-10' },
      ];

      for (const teacher of teachers) {
        await addDoc(collection(db, 'teachers'), teacher);
      }

      // 3. Add Fees
      const months = ['January', 'February', 'March'];
      for (let i = 0; i < studentIds.length; i++) {
        await addDoc(collection(db, 'fees'), {
          studentId: studentIds[i],
          studentName: students[i].name,
          amount: 500,
          month: months[i % 3],
          year: 2024,
          status: i % 2 === 0 ? 'Paid' : 'Unpaid',
          paymentDate: i % 2 === 0 ? '2024-03-15' : null
        });
      }

      // 4. Add Attendance
      const today = new Date().toISOString().split('T')[0];
      for (let i = 0; i < studentIds.length; i++) {
        await addDoc(collection(db, 'attendance'), {
          studentId: studentIds[i],
          date: today,
          status: i % 4 === 0 ? 'Absent' : 'Present',
          class: students[i].class
        });
      }

      toast.success('Dummy data seeded successfully!');
      setIsDone(true);
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed data');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Need test data?</h3>
          <p className="text-sm text-gray-600">Quickly populate your ERP with dummy students, teachers, and records.</p>
        </div>
      </div>
      
      <button
        onClick={seedDatabase}
        disabled={isSeeding || isDone}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
          isDone 
            ? 'bg-green-100 text-green-700 cursor-default' 
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-100'
        }`}
      >
        {isSeeding ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Seeding Data...
          </>
        ) : isDone ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Data Seeded
          </>
        ) : (
          <>
            <Database className="w-5 h-5" />
            Seed Test Data
          </>
        )}
      </button>
    </div>
  );
};
