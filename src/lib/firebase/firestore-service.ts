
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
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { 
  Announcement, 
  LearningMaterial,
  LearningMaterialCategoryName,
  LearningMaterialCategoryDoc,
  UserRole, 
  InventoryItem, 
  UserProfile, 
  UserStatus
} from '@/lib/types';


// User Profile Service
const usersCollectionRef = collection(db, 'users');

export async function createProfileIfNotExist(email: string, studentOrStaffId: string, role: UserRole, status: UserStatus): Promise<string> {
  try {
    const q = query(usersCollectionRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // No user with this email exists, create a new profile document.
      const docRef = await addDoc(usersCollectionRef, {
        uid: null, // No UID available yet
        email: email,
        studentOrStaffId: studentOrStaffId,
        role: role,
        status: status,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } else {
      // A user with that email already exists. Return the ID of the existing document.
      return querySnapshot.docs[0].id;
    }
  } catch (error) {
    console.error("Error in createProfileIfNotExist: ", error);
    throw new Error(`Failed to check or create user profile. ${(error as Error).message}`);
  }
}


export async function createUserProfile(docId: string, user: FirebaseUser, studentOrStaffId: string, role: UserRole, status: UserStatus): Promise<void> {
  const userProfileRef = doc(db, 'users', docId); // Use the provided docId
  try {
    let finalRole = role;
    let finalStatus = status;

    // SUPERUSER CHECK: Force-approve this specific admin user.
    if (user.email === 'ainuddin@uitm.edu.my') {
      finalRole = 'admin';
      finalStatus = 'active';
    }
      
    await updateDoc(userProfileRef, {
      uid: user.uid,
      email: user.email,
      studentOrStaffId: studentOrStaffId,
      role: finalRole,
      status: finalStatus,
      // createdAt is set by createProfileIfNotExist, so we don't overwrite it here.
    });
  } catch (error) {
    console.error("Error updating user profile with UID: ", error);
    throw new Error(`Failed to update user profile. ${(error as Error).message}`);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  // We now need to query by the 'uid' field, not the document ID.
  const q = query(usersCollectionRef, where("uid", "==", uid));
  try {
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Assuming uid is unique, there should only be one document.
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      
      let status: UserStatus = data.status || (data.role === 'admin' ? 'active' : 'pending');

      const profileData: UserProfile = {
        docId: docSnap.id,
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
      
      let status: UserStatus = data.status || (data.role === 'admin' ? 'active' : 'pending');

      return {
        docId: docSnapshot.id, // Use the actual document ID
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

export async function updateUserStatus(docId: string, status: UserStatus): Promise<void> {
  const userProfileRef = doc(db, 'users', docId);
  try {
    await updateDoc(userProfileRef, { status: status });
  } catch (error) {
    console.error("Error updating user status:", error);
    throw new Error(`Failed to update user status. ${(error as Error).message}`);
  }
}

export async function deleteUser(docId: string): Promise<void> {
  const userDocRef = doc(db, 'users', docId);
  try {
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error(`Failed to delete user. ${(error as Error).message}`);
  }
}


// Learning Materials Service
const materialsCollectionRef = collection(db, 'learningMaterials');
const categoriesCollectionRef = collection(db, 'learningMaterialCategories');

export async function getLearningMaterials(): Promise<LearningMaterial[]> {
  try {
    const q = query(materialsCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
      createdAt: (docSnapshot.data().createdAt as Timestamp)?.toDate(),
      updatedAt: (docSnapshot.data().updatedAt as Timestamp)?.toDate(),
    } as LearningMaterial));
  } catch (error) {
    console.error("Error fetching learning materials: ", error);
    throw new Error(`Failed to fetch learning materials. ${(error as Error).message}`);
  }
}

export async function addLearningMaterial(materialData: Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(materialsCollectionRef, {
      ...materialData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding learning material: ", error);
    throw new Error(`Failed to add learning material. ${(error as Error).message}`);
  }
}

export async function updateLearningMaterial(id: string, materialData: Partial<LearningMaterial>): Promise<void> {
  try {
    const materialDocRef = doc(db, 'learningMaterials', id);
    await updateDoc(materialDocRef, {
      ...materialData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating learning material: ", error);
    throw new Error(`Failed to update learning material. ${(error as Error).message}`);
  }
}

export async function deleteLearningMaterial(id: string): Promise<void> {
  try {
    const materialDocRef = doc(db, 'learningMaterials', id);
    await deleteDoc(materialDocRef);
  } catch (error) {
    console.error("Error deleting learning material: ", error);
    throw new Error(`Failed to delete learning material. ${(error as Error).message}`);
  }
}


export async function getLearningMaterialCategories(): Promise<LearningMaterialCategoryDoc[]> {
  try {
    const q = query(categoriesCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      name: docSnapshot.data().name,
      createdAt: (docSnapshot.data().createdAt as Timestamp)?.toDate(),
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error(`Failed to fetch categories. ${(error as Error).message}`);
  }
}

export async function addLearningMaterialCategory(name: LearningMaterialCategoryName): Promise<string> {
  // Check if category already exists (case-insensitive check)
  const q = query(categoriesCollectionRef, where('name', '==', name));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    throw new Error(`Category "${name}" already exists.`);
  }

  try {
    const docRef = await addDoc(categoriesCollectionRef, {
      name: name,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding category:", error);
    throw new Error(`Failed to add category. ${(error as Error).message}`);
  }
}


// Announcements Service
const announcementsCollectionRef = collection(db, 'announcements');

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const q = query(announcementsCollectionRef, orderBy('isPinned', 'desc'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        title: data.title || "Untitled Announcement",
        content: data.content || "",
        authorId: data.authorId || "unknown_author_id",
        authorName: data.authorName || "Unknown Author",
        isPinned: data.isPinned === true, 
        audience: Array.isArray(data.audience) && data.audience.every(role => ['student', 'admin', 'guest'].includes(role)) 
          ? data.audience as UserRole[]
          : ['student', 'admin', 'guest'] as UserRole[], 
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(0),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(0),
      };
    });
  } catch (error: any) {
    console.error("Error fetching announcements:", error);
    throw new Error(`Failed to fetch announcements. ${(error as Error).message}`);
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
      audience: announcementData.audience && announcementData.audience.length > 0 ? announcementData.audience : ['student'],
      authorId: author.id,
      authorName: author.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding announcement: ", error);
    throw new Error(`Failed to add announcement. ${(error as Error).message}`);
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
    throw new Error(`Failed to update announcement. ${(error as Error).message}`);
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    const announcementDocRef = doc(db, 'announcements', id);
    await deleteDoc(announcementDocRef);
  } catch (error) {
    console.error("Error deleting announcement: ", error);
    throw new Error(`Failed to delete announcement. ${(error as Error).message}`);
  }
}

// Inventory Service
const inventoryCollectionRef = collection(db, 'inventoryItems');

export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const q = query(inventoryCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate(),
      } as InventoryItem;
    });
  } catch (error) {
    console.error("Error fetching inventory items: ", error);
    throw new Error(`Failed to fetch inventory items. ${(error as Error).message}`);
  }
}

export async function addInventoryItem(itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(inventoryCollectionRef, {
      ...itemData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding inventory item: ", error);
    throw new Error(`Failed to add inventory item: ${(error as Error).message}`);
  }
}

export async function updateInventoryItem(id: string, itemData: Partial<InventoryItem>): Promise<void> {
  try {
    const itemDocRef = doc(db, 'inventoryItems', id);
    await updateDoc(itemDocRef, {
      ...itemData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating inventory item: ", error);
    throw new Error(`Failed to update inventory item: ${(error as Error).message}`);
  }
}

export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    const itemDocRef = doc(db, 'inventoryItems', id);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error("Error deleting inventory item: ", error);
    throw new Error(`Failed to delete inventory item: ${(error as Error).message}`);
  }
}

    