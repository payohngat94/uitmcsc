
'use server';

import { db } from './config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  setDoc,
  getDoc,
  where,
  runTransaction,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { LearningMaterial, LearningMaterialCategoryDoc, LearningMaterialCategoryName, Announcement, UserRole, InventoryItem, InventoryItemStatus, InventoryItemType, UserProfile, UserStatus } from '@/lib/types';


// User Profile Service
const usersCollectionRef = collection(db, 'users');

export async function createProfileIfNotExist(email: string, studentOrStaffId: string, role: UserRole, status: UserStatus): Promise<void> {
  try {
    const q = query(usersCollectionRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      // No user with this email exists, create a new profile document with an auto-generated ID.
      // Note: This document won't have a UID from Auth until the user is successfully created and the profile is updated.
      await addDoc(usersCollectionRef, {
        uid: null, // No UID available yet
        email: email,
        studentOrStaffId: studentOrStaffId,
        role: role,
        status: status,
        createdAt: serverTimestamp(),
      });
    }
    // If a user with that email already exists, we do nothing.
  } catch (error) {
    console.error("Error in createProfileIfNotExist: ", error);
    // We are suppressing the error throw to ensure the auth process can continue
    // throw new Error(`Failed to check or create user profile. ${(error as Error).message}`);
  }
}


export async function createUserProfile(user: FirebaseUser, studentOrStaffId: string, role: UserRole, status: UserStatus): Promise<void> {
  const userProfileRef = doc(db, 'users', user.uid);
  try {
    await runTransaction(db, async (transaction) => {
      const userProfileDoc = await transaction.get(userProfileRef);
      if (userProfileDoc.exists()) {
        // If a document with this UID already exists, something is wrong.
        // This should not happen in a normal registration flow.
        console.warn(`User profile for UID ${user.uid} already exists. Overwriting.`);
      }

      let finalRole = role;
      let finalStatus = status;

      // SUPERUSER CHECK: Force-approve this specific admin user.
      if (user.email === 'ainuddin@uitm.edu.my') {
        finalRole = 'admin';
        finalStatus = 'active';
      }

      transaction.set(userProfileRef, {
        uid: user.uid,
        email: user.email,
        studentOrStaffId: studentOrStaffId,
        role: finalRole,
        status: finalStatus,
        createdAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error("Error creating user profile in transaction: ", error);
    throw new Error(`Failed to create user profile. ${(error as Error).message}`);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userProfileRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(userProfileRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      let status: UserStatus;
      if (data.status) {
        status = data.status;
      } else {
        status = data.role === 'admin' ? 'active' : 'pending';
      }

      const profileData: UserProfile = {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName || data.studentOrStaffId,
        studentOrStaffId: data.studentOrStaffId,
        role: data.role,
        status: status,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      };
      return profileData;
    }
    return null;
  } catch (error: any) {
    console.error("Error fetching user profile: ", error);
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
        console.warn(`Permission denied when fetching profile for UID ${uid}. This is an expected behavior if security rules are restrictive and the current user is not an admin. Returning null.`);
        return null;
    }
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(`Failed to fetch user profile. ${(error as Error).message}`);
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const q = query(usersCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      
      let status: UserStatus;
      if (data.status) {
        status = data.status;
      } else {
        status = data.role === 'admin' ? 'active' : 'pending';
      }

      return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName || data.studentOrStaffId,
        studentOrStaffId: data.studentOrStaffId,
        role: data.role,
        status: status,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      };
    });
  } catch (error: any) {
    console.error("Error fetching all users:", error);
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      throw new Error("Failed to fetch users due to Firestore security rules. Please ensure that admin users have permission to read the '/users' collection.");
    }
    throw new Error(`Failed to fetch users. ${(error as Error).message}`);
  }
}

export async function updateUserStatus(uid: string, status: UserStatus): Promise<void> {
  const userProfileRef = doc(db, 'users', uid);
  try {
    await updateDoc(userProfileRef, { status: status });
  } catch (error) {
    console.error("Error updating user status:", error);
    throw new Error(`Failed to update user status. ${(error as Error).message}`);
  }
}



// Learning Material Categories Service
const learningMaterialCategoriesCollectionRef = collection(db, 'learningMaterialCategories');

export async function getLearningMaterialCategories(): Promise<LearningMaterialCategoryDoc[]> {
  console.log("SERVER ACTION: getLearningMaterialCategories - Entry");
  try {
    const q = query(learningMaterialCategoriesCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const categories = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        name: data.name as LearningMaterialCategoryName,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      } as LearningMaterialCategoryDoc;
    });
    console.log("SERVER ACTION: getLearningMaterialCategories - Success, Count:", categories.length);
    return categories;
  } catch (error: any) {
    console.error("SERVER ACTION: getLearningMaterialCategories - ERROR:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch learning material categories. Original error: ${error.message || 'Unknown error'}`);
  }
}

export async function addLearningMaterialCategory(categoryName: LearningMaterialCategoryName): Promise<string> {
  try {
    const allCategoriesSnapshot = await getDocs(learningMaterialCategoriesCollectionRef);
    const lowerCaseCategoryName = categoryName.toLowerCase();
    const existingCategory = allCategoriesSnapshot.docs.find(
      doc => (doc.data().name as string).toLowerCase() === lowerCaseCategoryName
    );

    if (existingCategory) {
      throw new Error(`Category "${categoryName}" already exists.`);
    }

    const docRef = await addDoc(learningMaterialCategoriesCollectionRef, {
      name: categoryName,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding learning material category: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to add learning material category: ${(error as Error).message || 'Unknown error'}`);
  }
}


// Learning Materials Service
const learningMaterialsCollectionRef = collection(db, 'learningMaterials');
export type LearningMaterialData = Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export async function getLearningMaterials(): Promise<LearningMaterial[]> {
  console.log("SERVER ACTION: getLearningMaterials - Entry");
  try {
    const q = query(learningMaterialsCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const materials = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        category: data.category as LearningMaterialCategoryName,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
      } as LearningMaterial;
    });
    console.log("SERVER ACTION: getLearningMaterials - Success, Count:", materials.length);
    return materials;
  } catch (error: any) {
    console.error("SERVER ACTION: getLearningMaterials - ERROR:", error.name, error.message, error.code);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch learning materials. Original error: ${(error as Error).message || 'Unknown error'}`);
  }
}

export async function addLearningMaterial(materialData: Omit<LearningMaterialData, 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(learningMaterialsCollectionRef, {
      ...materialData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding learning material: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add learning material.");
  }
}

export async function updateLearningMaterial(id: string, materialData: Partial<LearningMaterialData>): Promise<void> {
  try {
    const materialDocRef = doc(db, 'learningMaterials', id);
    await updateDoc(materialDocRef, {
      ...materialData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating learning material: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update learning material.");
  }
}

export async function deleteLearningMaterial(id: string): Promise<void> {
  try {
    const materialDocRef = doc(db, 'learningMaterials', id);
    await deleteDoc(materialDocRef);
  } catch (error) {
    console.error("Error deleting learning material: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete learning material.");
  }
}


// Announcements Service
const announcementsCollectionRef = collection(db, 'announcements');
export type AnnouncementData = Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'> & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};


export async function getAnnouncements(): Promise<Announcement[]> {
  console.log("SERVER ACTION: getAnnouncements - Entry");
  try {
    const q = query(announcementsCollectionRef, orderBy('isPinned', 'desc'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const announcements = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      let createdAtDate;
      if (data.createdAt instanceof Timestamp) {
        createdAtDate = data.createdAt.toDate();
      } else if (data.createdAt && typeof data.createdAt.seconds === 'number' && typeof data.createdAt.nanoseconds === 'number') {
        createdAtDate = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate();
      } else if (data.createdAt) {
        const parsed = new Date(data.createdAt);
        createdAtDate = isNaN(parsed.getTime()) ? new Date(0) : parsed;
      } else {
        createdAtDate = new Date(0); 
      }

      let updatedAtDate;
      if (data.updatedAt instanceof Timestamp) {
        updatedAtDate = data.updatedAt.toDate();
      } else if (data.updatedAt && typeof data.updatedAt.seconds === 'number' && typeof data.updatedAt.nanoseconds === 'number') {
        updatedAtDate = new Timestamp(data.updatedAt.seconds, data.updatedAt.nanoseconds).toDate();
      } else if (data.updatedAt) {
        const parsed = new Date(data.updatedAt);
        updatedAtDate = isNaN(parsed.getTime()) ? createdAtDate : parsed;
      } else {
        updatedAtDate = createdAtDate; 
      }

      return {
        id: docSnapshot.id,
        title: data.title || "Untitled Announcement",
        content: data.content || "",
        authorId: data.authorId || "unknown_author_id",
        authorName: data.authorName || "Unknown Author",
        isPinned: data.isPinned === true, 
        audience: Array.isArray(data.audience) && data.audience.every(role => ['student', 'admin', 'guest'].includes(role)) // Added 'guest'
          ? data.audience as UserRole[]
          : ['student', 'admin', 'guest'] as UserRole[], // Added 'guest' to fallback
        createdAt: createdAtDate,
        updatedAt: updatedAtDate,
      };
    });
    
    console.log("SERVER ACTION: getAnnouncements - Success, Count:", announcements.length);
    return announcements;

  } catch (error: any) {
    console.error("SERVER ACTION: getAnnouncements - ERROR:", error.name, error.message, error.code);
    if (error instanceof Error) { 
        throw error; 
    }
    throw new Error(`Failed to fetch announcements. Original error: ${(error as any)?.message || 'Unknown Firebase error'}`);
  }
}

export async function addAnnouncement(
  announcementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'>,
  author: { id: string; name: string }
): Promise<string> {
  try {
    const docRef = await addDoc(announcementsCollectionRef, {
      ...announcementData,
      isPinned: announcementData.isPinned || false,
      // Use provided audience, or default to ['student'] if not provided or empty
      audience: announcementData.audience && announcementData.audience.length > 0 ? announcementData.audience : ['student'],
      authorId: author.id,
      authorName: author.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding announcement: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add announcement.");
  }
}

export async function updateAnnouncement(id: string, announcementData: Partial<Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'>>): Promise<void> {
  try {
    const announcementDocRef = doc(db, 'announcements', id);
    await updateDoc(announcementDocRef, {
      ...announcementData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating announcement: ", error);
     if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update announcement.");
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    const announcementDocRef = doc(db, 'announcements', id);
    await deleteDoc(announcementDocRef);
  } catch (error) {
    console.error("Error deleting announcement: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete announcement.");
  }
}

// Inventory Service
const inventoryCollectionRef = collection(db, 'inventoryItems');
export type InventoryItemData = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  imageUrls?: string[]; // Ensure this matches the type
};


export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const q = query(inventoryCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        itemType: data.itemType as InventoryItemType,
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [], // Handle if imageUrls is not an array
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
      } as InventoryItem;
    });
  } catch (error) {
    console.error("Error fetching inventory items: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch inventory items.");
  }
}

export async function addInventoryItem(itemData: Omit<InventoryItemData, 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(inventoryCollectionRef, {
      ...itemData,
      itemType: itemData.itemType || 'equipment', 
      imageUrls: Array.isArray(itemData.imageUrls) ? itemData.imageUrls : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding inventory item: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to add inventory item: ${(error as Error).message}`);
  }
}

export async function updateInventoryItem(id: string, itemData: Partial<InventoryItemData>): Promise<void> {
  try {
    const itemDocRef = doc(db, 'inventoryItems', id);
    const dataToUpdate = { ...itemData };
    if (itemData.imageUrls !== undefined) {
        dataToUpdate.imageUrls = Array.isArray(itemData.imageUrls) ? itemData.imageUrls : [];
    }

    await updateDoc(itemDocRef, {
      ...dataToUpdate,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating inventory item: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to update inventory item: ${(error as Error).message}`);
  }
}

export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    const itemDocRef = doc(db, 'inventoryItems', id);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error("Error deleting inventory item: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to delete inventory item: ${(error as Error).message}`);
  }
}

    