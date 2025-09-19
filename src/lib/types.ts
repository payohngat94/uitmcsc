
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'student' | 'guest';
export type UserStatus = 'pending' | 'active' | 'rejected';

// This represents the data for a user profile stored in the 'users' collection in Firestore.
export type UserProfile = {
  docId: string; // The Firestore document ID, guaranteed to be unique.
  uid: string | null; // The Firebase Auth UID, may be null initially.
  email: string | null;
  displayName: string | null; // This will hold the Student/Staff ID
  studentOrStaffId: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Timestamp | Date;
};


// --- NEW LEARNING MATERIAL TYPES ---

export type LearningMaterialCategoryName = string; 

export type LearningMaterialCategoryDoc = {
  id: string;
  name: LearningMaterialCategoryName;
  createdAt?: Timestamp | Date;
};

export type ContentItemType = 'video' | 'document' | 'slides';

// Represents an individual piece of content, like a video or a PDF.
export type ContentItem = {
  id: string;
  topicId: string; // Foreign key to the Topic
  title: string;
  type: ContentItemType;
  url: string;
  description?: string;
  thumbnailUrl?: string; // Specific thumbnail for this item
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
};

// Represents a learning topic that groups multiple content items.
export type Topic = {
  id: string;
  title: string;
  category: LearningMaterialCategoryName;
  description?: string;
  thumbnailUrl?: string; // General thumbnail for the topic
  tags?: string[]; // e.g., 'Emergency Medicine', 'Respiratory'
  yearLevels?: string[]; // e.g., '3', '4', '5'
  resourceSummary: {
    videoCount: number;
    documentCount: number;
    slidesCount: number;
    hasVideo: boolean;
    hasDocument: boolean;
    hasSlides: boolean;
  },
  contentItems: ContentItem[]; // Populated on the client
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
};


// --- DEPRECATED ---
// This is the old, flat structure for learning materials.
// It is being replaced by the Topic/ContentItem structure.
export type LearningMaterial = {
  id: string; 
  title: string;
  category: LearningMaterialCategoryName; 
  type: ContentItemType;
  url: string;
  description?: string;
  thumbnailUrl?: string;
  specialties?: string[];
  createdAt?: Timestamp | Date; 
  updatedAt?: Timestamp | Date; 
};


// --- OTHER TYPES ---

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

export type InventoryItemStatus = 'available' | 'in-use' | 'reserved' | 'out-of-stock' | 'maintenance';
export type InventoryItemType = 'facility' | 'equipment';

export type InventoryItem = {
  id: string;
  name: string;
  itemType?: InventoryItemType;
  description?: string;
  status: InventoryItemStatus;
  quantity: number;
  imageUrls?: string[]; 
  location?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
};

export type Announcement = {
  id: string; 
  title: string;
  content: string;
  authorId: string; 
  authorName: string; 
  createdAt: Timestamp | Date; 
  updatedAt?: Timestamp | Date; 
  isPinned?: boolean;
  audience?: UserRole[]; 
};

    