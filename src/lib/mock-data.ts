import type { LearningMaterial, Booking, InventoryItem, Announcement } from './types';

export const mockLearningMaterials: LearningMaterial[] = [
  {
    id: 'lm1',
    title: 'Introduction to Physical Examination',
    category: 'Physical Examination',
    type: 'video',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Replace with actual video
    thumbnailUrl: 'https://placehold.co/300x200.png',
    description: 'A comprehensive overview of basic physical examination techniques.'
  },
  {
    id: 'lm2',
    title: 'Suturing Techniques Guide',
    category: 'Focused Skill Station',
    type: 'document',
    url: '/path/to/suturing-guide.pdf', // Placeholder path
    description: 'Step-by-step guide on various suturing methods.'
  },
  {
    id: 'lm3',
    title: 'History Taking Best Practices',
    category: 'Early Clinical Exposure',
    type: 'slides',
    url: '/path/to/history-taking.ppt', // Placeholder path
    thumbnailUrl: 'https://placehold.co/300x200.png',
    description: 'Key principles and examples for effective patient history taking.'
  },
  {
    id: 'lm4',
    title: 'ECG Interpretation Basics',
    category: 'Focused Skill Station',
    type: 'video',
    url: 'https://www.youtube.com/embed/someOtherVideoID',
    thumbnailUrl: 'https://placehold.co/300x200.png',
    description: 'Learn the fundamentals of ECG interpretation for common cardiac conditions.'
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    studentId: 's123',
    studentName: 'Alice Wonderland',
    sessionId: 'lab-osce-1',
    sessionName: 'OSCE Practice Session 1',
    startTime: new Date(new Date().setDate(new Date().getDate() + 3)),
    endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 3)).setHours(new Date().getHours() + 2)),
    status: 'confirmed',
  },
  {
    id: 'b2',
    studentId: 's456',
    studentName: 'Bob The Builder',
    sessionId: 'skill-lab-suture',
    sessionName: 'Suturing Skills Lab',
    startTime: new Date(new Date().setDate(new Date().getDate() + 5)),
    endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 5)).setHours(new Date().getHours() + 1)),
    status: 'pending',
  },
];

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv1',
    name: 'Adult CPR Manikin',
    status: 'available',
    quantity: 5,
    imageUrl: 'https://placehold.co/100x100.png',
    location: 'Sim Lab A',
  },
  {
    id: 'inv2',
    name: 'ECG Machine',
    status: 'in-use',
    quantity: 2,
    imageUrl: 'https://placehold.co/100x100.png',
    location: 'Sim Lab B',
  },
  {
    id: 'inv3',
    name: 'Suture Practice Kit',
    status: 'reserved',
    quantity: 10,
    imageUrl: 'https://placehold.co/100x100.png',
    location: 'Storage Room 1',
  },
  {
    id: 'inv4',
    name: 'Stethoscope',
    status: 'available',
    quantity: 20,
    imageUrl: 'https://placehold.co/100x100.png',
    location: 'Loan Desk',
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'an1',
    title: 'New OSCE Schedule Released',
    content: 'The schedule for the upcoming OSCE has been released. Please check your emails and the portal for your assigned slots.',
    author: 'Dr. Eva Curricula',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    isPinned: true,
  },
  {
    id: 'an2',
    title: 'Sim Lab Maintenance Notice',
    content: 'Sim Lab B will be closed for maintenance on Friday from 2 PM to 5 PM. Please plan your bookings accordingly.',
    author: 'Lab Coordinator Team',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
  },
  {
    id: 'an3',
    title: 'Guest Lecture on Advanced Diagnostics',
    content: 'Join us for a guest lecture by Dr. Insight on Wed, 3 PM in Auditorium Hall. Topic: Advanced Diagnostic Techniques.',
    author: 'Admin Office',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
  },
];
