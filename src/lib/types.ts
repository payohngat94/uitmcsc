

export type User = {
  id: string;
  email: string;
  role: 'student' | 'admin' | 'educator' | 'coordinator';
  name?: string;
};

export type LearningMaterialCategory = "Early Clinical Exposure" | "Focused Skill Station" | "Physical Examination" | "Procedural Skills" | "Communication Skills";
export type LearningMaterialType = 'video' | 'document' | 'slides';

export type LearningMaterial = {
  id: string;
  title: string;
  category: LearningMaterialCategory;
  type: LearningMaterialType;
  url: string; // YouTube embed URL or path to PDF/slides
  description?: string;
  thumbnailUrl?: string; // For videos or a preview image
};

export type Booking = {
  id:string;
  studentId: string;
  studentName?: string;
  sessionId: string;
  sessionName: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
};

export type InventoryItem = {
  id: string;
  name: string;
  description?: string;
  status: 'available' | 'in-use' | 'reserved' | 'out-of-stock' | 'maintenance';
  quantity: number;
  imageUrl?: string;
  location?: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  isPinned?: boolean;
  audience?: User['role'][]; // e.g., ['student', 'educator']
};
