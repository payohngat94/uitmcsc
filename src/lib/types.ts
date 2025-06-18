
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'student';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  // Firebase User properties that we might use from auth.currentUser
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
};

// export type LearningMaterialCategory = "Early Clinical Exposure" | "Focused Skill Station" | "Physical Examination" | "Procedural Skills" | "Communication Skills"; // OLD
export type LearningMaterialCategoryName = string; // NEW - category names are now dynamic strings

export type LearningMaterialCategoryDoc = {
  id: string;
  name: LearningMaterialCategoryName;
  createdAt?: Timestamp | Date;
  // could add description, icon, color etc. in future
};

export type LearningMaterialType = 'video' | 'document' | 'slides';

export type LearningMaterial = {
  id: string; // Firestore document ID
  title: string;
  category: LearningMaterialCategoryName; // NEW - uses the dynamic string name
  type: LearningMaterialType;
  url: string;
  description?: string;
  thumbnailUrl?: string;
  specialties?: string[];
  createdAt?: Timestamp | Date; // Can be Firestore Timestamp or JS Date after conversion
  updatedAt?: Timestamp | Date; // Can be Firestore Timestamp or JS Date after conversion
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

export type InventoryItemStatus = 'available' | 'in-use' | 'reserved' | 'out-of-stock' | 'maintenance';
export type InventoryItemType = 'facility' | 'equipment';

export type InventoryItem = {
  id: string;
  name: string;
  itemType?: InventoryItemType; // Added itemType
  description?: string;
  status: InventoryItemStatus;
  quantity: number;
  imageUrl?: string; // Changed from imageUrls: string[]
  location?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
};

export type Announcement = {
  id: string; // Firestore document ID
  title: string;
  content: string;
  authorId: string; // UID of the user who created it
  authorName: string; // Display name of the user
  createdAt: Timestamp | Date; // Firestore Timestamp or JS Date after conversion
  updatedAt?: Timestamp | Date; // Firestore Timestamp or JS Date after conversion
  isPinned?: boolean;
  audience?: UserRole[]; // 'admin' | 'student'
};
