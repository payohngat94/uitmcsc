
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
  console.log("🚀 SERVER ACTION: getLearningMaterials - Function Entry Point 🚀");
  try {
    const q = query(learningMaterialsCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const materials = querySnapshot.docs.map(docSnapshot => { // Renamed 'doc' to 'docSnapshot' to avoid conflict
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
      } as LearningMaterial;
    });
    console.log("✅ SERVER ACTION: getLearningMaterials - Fetched successfully ✅, Count:", materials.length);
    return materials;
  } catch (error: any) {
    console.error("❌ SERVER ACTION: getLearningMaterials - !!! ERROR CAUGHT !!! ❌");
    console.error("Error fetching learning materials from Firestore (inside catch block of getLearningMaterials):");
    const firebaseError = error as { name?: string; message?: string; code?: string };
    const errorMessage = `Failed to fetch learning materials. Original error: Name: ${firebaseError.name || 'N/A'}, Message: ${firebaseError.message || 'N/A'}, Code: ${firebaseError.code || 'N/A'}`;
    console.error("Detailed Firebase Error for client:", errorMessage);
    console.error("Original error object (raw):", error);
    
    if (error instanceof Error) {
      throw error; // Re-throw the original error to be caught by the client
    }
    throw new Error(errorMessage); // Fallback for non-Error objects
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
  console.log("🚀 SERVER ACTION: getAnnouncements - Function Entry Point 🚀");
  try {
    const pinnedQuery = query(
      announcementsCollectionRef,
      where('isPinned', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unpinnedQuery = query(
      announcementsCollectionRef,
      // Firestore does not allow inequality filters on one field and orderBy on another if an index for that specific combination doesn't exist.
      // To simplify and avoid needing another complex index immediately, let's fetch all non-true isPinned (which includes false and non-existent)
      // and then filter client-side if needed, OR ensure all documents have `isPinned` set to false explicitly.
      // For now, assuming most will be `false` if not `true`. If `isPinned` can be absent, this query needs adjustment or an index.
      // A more robust query if `isPinned` can be absent and you need to order by `createdAt` would be to query without this `isPinned` filter for unpinned,
      // or ensure `isPinned` always exists.
      // For now, keeping it simple:
      where('isPinned', '!=', true), // This gets 'false' and documents where 'isPinned' might be missing.
      orderBy('createdAt', 'desc')
    );

    // If the above query causes issues due to 'isPinned' potentially not existing on all docs,
    // a safer approach is to fetch all and sort/filter in code, or ensure 'isPinned' always has a value (true/false).
    // Alternative: fetch all ordered by createdAt, then separate pinned ones.
    // const allQuery = query(announcementsCollectionRef, orderBy('createdAt', 'desc'));
    
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
        isPinned: data.isPinned === true, // Ensure boolean
        audience: Array.isArray(data.audience) && data.audience.every(role => ['student', 'admin'].includes(role))
          ? data.audience as UserRole[]
          : ['student', 'admin'] as UserRole[], // Default if invalid or missing
        createdAt: createdAtDate,
        updatedAt: updatedAtDate,
      };
    };

    const pinnedAnnouncements = pinnedSnapshot.docs.map(transformDoc);
    const unpinnedAnnouncements = unpinnedSnapshot.docs.map(transformDoc).filter(a => a.isPinned === false); // Ensure we only take non-pinned
    
    console.log("✅ SERVER ACTION: getAnnouncements - Fetched successfully ✅, Count:", pinnedAnnouncements.length + unpinnedAnnouncements.length);
    return [...pinnedAnnouncements, ...unpinnedAnnouncements];

  } catch (error: any) {
    console.error("❌ SERVER ACTION: getAnnouncements - !!! ERROR CAUGHT !!! ❌");
    console.error("Error fetching announcements from Firestore (inside catch block of getAnnouncements):");
    const firebaseError = error as { name?: string; message?: string; code?: string };
    const errorMessage = `Failed to fetch announcements. Original error: Name: ${firebaseError.name || 'N/A'}, Message: ${firebaseError.message || 'N/A'}, Code: ${firebaseError.code || 'N/A'}`;
    console.error("Detailed Firebase Error for client:", errorMessage);
    console.error("Original error object (raw):", error);

    if (error instanceof Error) {
      throw error; // Re-throw the original error to be caught by the client
    }
    throw new Error(errorMessage); // Fallback for non-Error objects
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
    const q = query(inventoryCollectionRef, orderBy('name', 'asc')); // Order by name for now
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
