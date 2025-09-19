
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


// --- NEW LEARNING MATERIALS STRUCTURE ---

export type ContentItemType = 'video' | 'document' | 'slides';

// Represents a single piece of content (e.g., one video, one PDF).
export type ContentItem = {
  id: string; // Firestore document ID
  topicId: string; // Foreign key to the 'topics' collection
  type: ContentItemType;
  title: string;
  url: string;
  description?: string;
  thumbnailUrl?: string; // Optional thumbnail for the specific item
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
};

// Summary of available resources within a topic.
// Stored within a Topic document to reduce queries.
export type TopicResourceSummary = {
  hasVideo: boolean;
  hasDocument: boolean;
  hasSlides: boolean;
  videoCount: number;
  documentCount: number;
  slidesCount: number;
};

// Represents a single learning topic (e.g., "Arterial Blood Gas Sampling").
export type Topic = {
  id: string; // Firestore document ID
  title: string;
  tags?: string[]; // For specialties like "Emergency Medicine"
  yearLevels?: number[]; // e.g., [3, 4, 5]
  description?: string;
  thumbnailUrl?: string; // A general thumbnail for the topic
  resourceSummary: TopicResourceSummary;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
};


// --- OLD TYPES (to be deprecated/removed) ---

export type LearningMaterialCategoryName = string; 

export type LearningMaterialCategoryDoc = {
  id: string;
  name: LearningMaterialCategoryName;
  createdAt?: Timestamp | Date;
};

export type LearningMaterialType = 'video' | 'document' | 'slides';

export type LearningMaterial = {
  id: string; 
  title: string;
  category: LearningMaterialCategoryName; 
  type: LearningMaterialType;
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
