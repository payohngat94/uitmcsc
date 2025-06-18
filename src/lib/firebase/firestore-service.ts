
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
import type { LearningMaterial, Announcement, UserRole } from '@/lib/types'; // Added Announcement, UserRole

// Learning Materials Service
const learningMaterialsCollectionRef = collection(db, 'learningMaterials');
export type LearningMaterialData = Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export async function getLearningMaterials(): Promise<LearningMaterial[]> {
  try {
    const q = query(learningMaterialsCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
      } as LearningMaterial;
    });
  } catch (error) {
    console.error("Error fetching learning materials: ", error);
    throw new Error("Failed to fetch learning materials.");
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
    throw new Error("Failed to update learning material.");
  }
}

export async function deleteLearningMaterial(id: string): Promise<void> {
  try {
    const materialDocRef = doc(db, 'learningMaterials', id);
    await deleteDoc(materialDocRef);
  } catch (error) {
    console.error("Error deleting learning material: ", error);
    throw new Error("Failed to delete learning material.");
  }
}


// Announcements Service
const announcementsCollectionRef = collection(db, 'announcements');
export type AnnouncementData = Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'> & {
  // authorId and authorName are added when creating, not expected in partial updates directly through this type
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};


export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const pinnedQuery = query(announcementsCollectionRef, where('isPinned', '==', true), orderBy('createdAt', 'desc'));
    const unpinnedQuery = query(announcementsCollectionRef, where('isPinned', '==', false), orderBy('createdAt', 'desc'));

    const [pinnedSnapshot, unpinnedSnapshot] = await Promise.all([
      getDocs(pinnedQuery),
      getDocs(unpinnedQuery),
    ]);
    
    const transformDoc = (docSnapshot: import('firebase/firestore').QueryDocumentSnapshot) => {
      const data = docSnapshot.data();
      // Ensure all fields of Announcement are present, providing defaults if necessary
      return {
        id: docSnapshot.id,
        title: data.title || "",
        content: data.content || "",
        authorId: data.authorId || "",
        authorName: data.authorName || "Unknown Author",
        isPinned: data.isPinned === true, // Explicitly ensure boolean
        audience: Array.isArray(data.audience) ? data.audience as UserRole[] : [],
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(0), // Default to epoch if invalid
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(0)),
      } as Announcement;
    };

    const pinnedAnnouncements = pinnedSnapshot.docs.map(transformDoc);
    const unpinnedAnnouncements = unpinnedSnapshot.docs.map(transformDoc);
    
    return [...pinnedAnnouncements, ...unpinnedAnnouncements];

  } catch (error) {
    console.error("Error fetching announcements from Firestore: ", error); // Log the specific Firebase error
    throw new Error("Failed to fetch announcements."); // Generic error for the UI
  }
}

export async function addAnnouncement(
  announcementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'>, 
  author: { id: string; name: string }
): Promise<string> {
  try {
    const docRef = await addDoc(announcementsCollectionRef, {
      ...announcementData,
      isPinned: announcementData.isPinned || false, // Ensure isPinned is explicitly set
      audience: announcementData.audience || [],   // Ensure audience is explicitly set
      authorId: author.id,
      authorName: author.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding announcement: ", error);
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
    throw new Error("Failed to update announcement.");
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    const announcementDocRef = doc(db, 'announcements', id);
    await deleteDoc(announcementDocRef);
  } catch (error) {
    console.error("Error deleting announcement: ", error);
    throw new Error("Failed to delete announcement.");
  }
}
