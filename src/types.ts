export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  parentName: string;
  parentEmail?: string;
  contactNumber: string;
  address: string;
  admissionDate: string;
  status: 'Active' | 'Inactive';
}

export interface Fee {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  month: string;
  year: number;
  status: 'Paid' | 'Unpaid';
  paymentDate?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  class: string;
}

export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'parent';
  studentId?: string;
}

export interface Parent {
  id?: string;
  name: string;
  email: string;
  password?: string;
  studentId: string;
  studentName?: string;
  contactNumber: string;
  status: 'active' | 'locked';
  createdAt: string;
}

export interface Permission {
  module: 'students' | 'teachers' | 'fees' | 'attendance' | 'exams' | 'reports' | 'admin' | 'timetable';
  access: 'none' | 'read' | 'write' | 'full';
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  salary: number;
  joiningDate: string;
  // New fields for credentials and permissions
  username: string;
  password?: string;
  role: 'admin' | 'teacher';
  status: 'active' | 'locked';
  failedAttempts: number;
  permissions: Permission[];
  assignedClasses: string[]; // e.g., ["10-A", "9-B"]
}

export interface Exam {
  id: string;
  title: string;
  class: string;
  subject: string;
  date: string;
  maxMarks: number;
  passingMarks: number;
}

export interface Result {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: number;
  status: 'Pass' | 'Fail';
}

export interface TimetableEntry {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  room?: string;
}

export interface Timetable {
  id: string;
  class: string;
  section: string;
  entries: TimetableEntry[];
  lastUpdated: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  recipientId: string; // 'all', 'teachers', 'parents', or specific UID
  recipientRole: 'admin' | 'teacher' | 'parent' | 'all';
  createdAt: string;
  readBy: string[]; // Array of UIDs who have read it
}
