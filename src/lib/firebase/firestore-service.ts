
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
  where,
  writeBatch,
} from 'firebase/firestore';
import type { LearningMaterial, Announcement, UserRole, InventoryItem, InventoryItemStatus } from '@/lib/types';

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
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
      } as LearningMaterial;
    });
    console.log("SERVER ACTION: getLearningMaterials - Success, Count:", materials.length);
    return materials;
  } catch (error: any) {
    console.error("SERVER ACTION: getLearningMaterials - ERROR:", error.name, error.message, error.code);
    console.error("Original error object (raw):", error);
    if (error instanceof Error) {
      throw error; 
    }
    throw new Error(`Failed to fetch learning materials. Original error: ${error.message || 'Unknown error'}`);
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
    const pinnedQuery = query(
      announcementsCollectionRef,
      where('isPinned', '==', true),
      orderBy('createdAt', 'desc')
    );
    // Changed '!=' to '==' for unpinned query for robustness.
    // This is generally a better practice and might simplify index requirements.
    const unpinnedQuery = query(
      announcementsCollectionRef,
      where('isPinned', '==', false), 
      orderBy('createdAt', 'desc')
    );
    
    const [pinnedSnapshot, unpinnedSnapshot] = await Promise.all([
      getDocs(pinnedQuery),
      getDocs(unpinnedQuery),
    ]);

    const transformDoc = (docSnapshot: import('firebase/firestore').QueryDocumentSnapshot): Announcement => {
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
    };

    const pinnedAnnouncements = pinnedSnapshot.docs.map(transformDoc);
    const unpinnedAnnouncements = unpinnedSnapshot.docs.map(transformDoc);
    
    console.log("SERVER ACTION: getAnnouncements - Success, Count:", pinnedAnnouncements.length + unpinnedAnnouncements.length);
    return [...pinnedAnnouncements, ...unpinnedAnnouncements];

  } catch (error: any) {
    console.error("SERVER ACTION: getAnnouncements - ERROR:", error.name, error.message, error.code);
    console.error("Original error object (raw):", error);
    // Re-throw the original error if it's an Error instance for better client-side details
    if (error instanceof Error) {
      throw error; 
    }
    // Fallback for non-Error objects
    throw new Error(`Failed to fetch announcements. Original error: ${error.message || 'Unknown error'}`);
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

export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    const itemDocRef = doc(db, 'inventoryItems', id);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error("Error deleting inventory item: ", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete inventory item.");
  }
}
    