
'use server';

import { db, storage } from './config'; // Import storage
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
  where,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Import storage functions
import type { LearningMaterial, LearningMaterialCategoryDoc, LearningMaterialCategoryName, Announcement, UserRole, InventoryItem, InventoryItemStatus, InventoryItemType } from '@/lib/types';

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
    // Case-insensitive check for duplicates
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
        audience: Array.isArray(data.audience) && data.audience.every(role => ['student', 'admin'].includes(role))
          ? data.audience as UserRole[]
          : ['student', 'admin'] as UserRole[],
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
      audience: announcementData.audience && announcementData.audience.length > 0 ? announcementData.audience : ['student', 'admin'],
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

// Firebase Storage Service
export async function uploadFileToFirebase(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) { // Changed to 'any' to access potential Firebase specific properties
    console.error("Firebase Storage Upload Error Details:");
    console.error("Full error object:", error); // Log the entire error object
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.message) {
      console.error("Error message:", error.message);
    }
    if (error.serverResponse) {
      console.error("Server response:", error.serverResponse);
    }
    // Re-throw a more generic error or the original if it's an instance of Error
    if (error instanceof Error) {
      throw new Error(`Failed to upload file: ${error.message}. Code: ${error.code || 'N/A'}`);
    }
    throw new Error("An unknown error occurred during file upload. Check console for details.");
  }
}

export async function deleteFileFromFirebase(fileUrl: string): Promise<void> {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn(`File not found for deletion, URL may have been invalid or already deleted: ${fileUrl}`);
      return; // Don't throw an error if the file doesn't exist
    }
    console.error("Error deleting file from Firebase Storage: ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    throw new Error("An unknown error occurred during file deletion.");
  }
}


// Inventory Service
const inventoryCollectionRef = collection(db, 'inventoryItems');
export type InventoryItemData = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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
        imageUrl: data.imageUrl || undefined, 
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
      imageUrl: itemData.imageUrl || null, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding inventory item: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add inventory item.");
  }
}

export async function updateInventoryItem(id: string, itemData: Partial<InventoryItemData>): Promise<void> {
  try {
    const itemDocRef = doc(db, 'inventoryItems', id);
    await updateDoc(itemDocRef, {
      ...itemData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating inventory item: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update inventory item.");
  }
}

export async function deleteInventoryItem(id: string, imageUrl?: string): Promise<void> {
  try {
    const itemDocRef = doc(db, 'inventoryItems', id);
    await deleteDoc(itemDocRef);

    if (imageUrl) {
      await deleteFileFromFirebase(imageUrl);
    }
  } catch (error) {
    console.error("Error deleting inventory item: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete inventory item.");
  }
}

