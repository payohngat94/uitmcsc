
import type { LearningMaterial, Booking, InventoryItem, Announcement } from './types';
import { Timestamp } from 'firebase/firestore';


// Mock learning materials are now illustrative, actual data will come from Firestore.
export const mockLearningMaterials: LearningMaterial[] = [
  {
    id: 'lm1',
    title: 'Introduction to Physical Examination',
    category: 'Physical Examination',
    type: 'video',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/RwkKXCCA_0k/maxresdefault.jpg',
    description: 'A comprehensive overview of basic physical examination techniques.',
    specialties: ['Internal Medicine', 'General Practice'],
    createdAt: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 2))).toDate(),
    updatedAt: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 1))).toDate(),
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
    itemType: 'equipment',
    status: 'available',
    quantity: 5,
    imageUrl: 'https://placehold.co/100x100.png',
    location: 'Sim Lab A',
  },
  {
    id: 'inv2',
    name: 'ECG Machine',
    itemType: 'equipment',
    status: 'in-use',
    quantity: 2,
    imageUrl: 'https://placehold.co/100x100.png',
    location: 'Sim Lab B',
  },
  {
    id: 'inv3',
    name: 'Suture Practice Kit',
    itemType: 'equipment',
    status: 'reserved',
    quantity: 10,
    imageUrl: 'https://placehold.co/100x100.png',
    location: 'Storage Room 1',
  },
  {
    id: 'inv4',
    name: 'Stethoscope',
    itemType: 'equipment',
    status: 'available',
    quantity: 20,
    imageUrl: 'https://placehold.co/100x100.png',
    location: 'Loan Desk',
  },
];

// Mock announcements are now illustrative. The page fetches from Firestore.
export const mockAnnouncements: Announcement[] = [
  {
    id: 'an1',
    title: 'New OSCE Schedule Released',
    content: 'The schedule for the upcoming OSCE has been released. Please check your emails and the portal for your assigned slots.',
    authorId: 'adminUser001',
    authorName: 'Dr. Eva Curricula',
    createdAt: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 1))).toDate(),
    updatedAt: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 1))).toDate(),
    isPinned: true,
    audience: ['student']
  },
  {
    id: 'an2',
    title: 'Sim Lab Maintenance Notice',
    content: 'Sim Lab B will be closed for maintenance on Friday from 2 PM to 5 PM. Please plan your bookings accordingly.',
    authorId: 'adminUser002',
    authorName: 'Lab Coordinator Team',
    createdAt: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 3))).toDate(),
    updatedAt: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 3))).toDate(),
    isPinned: false,
    audience: ['student', 'admin']
  },
];
