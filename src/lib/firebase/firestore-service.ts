
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
import type { LearningMaterial, Announcement, UserRole } from '@/lib/types';

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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};


export async function getAnnouncements(): Promise<Announcement[]> {
  console.log("getAnnouncements (server action): Attempting to fetch announcements from Firestore...");
  try {
    const pinnedQuery = query(
      announcementsCollectionRef,
      where('isPinned', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unpinnedQuery = query(
      announcementsCollectionRef,
      where('isPinned', '==', false), // Ensure this is explicitly false
      orderBy('createdAt', 'desc')
    );

    console.log("getAnnouncements (server action): Executing pinned and unpinned queries...");
    const [pinnedSnapshot, unpinnedSnapshot] = await Promise.all([
      getDocs(pinnedQuery),
      getDocs(unpinnedQuery),
    ]);
    console.log("getAnnouncements (server action): Queries executed. Pinned docs:", pinnedSnapshot.docs.length, "Unpinned docs:", unpinnedSnapshot.docs.length);
    
    const transformDoc = (docSnapshot: import('firebase/firestore').QueryDocumentSnapshot): Announcement => {
      const data = docSnapshot.data();
      // Robust date handling: ensure createdAt is always a Date, default to epoch if missing/invalid
      let createdAtDate;
      if (data.createdAt instanceof Timestamp) {
        createdAtDate = data.createdAt.toDate();
      } else if (data.createdAt && typeof data.createdAt.seconds === 'number' && typeof data.createdAt.nanoseconds === 'number') {
        // Handle plain object Timestamps if they occur (e.g. from incorrect manual entry or older data)
        createdAtDate = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate();
      } else if (data.createdAt) {
        const parsed = new Date(data.createdAt);
        createdAtDate = isNaN(parsed.getTime()) ? new Date(0) : parsed; // Default to epoch if unparsable
      } else {
        createdAtDate = new Date(0); // Default to epoch if field is missing
      }

      let updatedAtDate;
      if (data.updatedAt instanceof Timestamp) {
        updatedAtDate = data.updatedAt.toDate();
      } else if (data.updatedAt && typeof data.updatedAt.seconds === 'number' && typeof data.updatedAt.nanoseconds === 'number') {
        updatedAtDate = new Timestamp(data.updatedAt.seconds, data.updatedAt.nanoseconds).toDate();
      } else if (data.updatedAt) {
        const parsed = new Date(data.updatedAt);
        updatedAtDate = isNaN(parsed.getTime()) ? createdAtDate : parsed; // Default to createdAt if unparsable
      } else {
        updatedAtDate = createdAtDate; // Default to createdAt if field is missing
      }

      return {
        id: docSnapshot.id,
        title: data.title || "Untitled Announcement",
        content: data.content || "",
        authorId: data.authorId || "unknown_author_id",
        authorName: data.authorName || "Unknown Author",
        isPinned: data.isPinned === true, // Explicitly check for true
        audience: Array.isArray(data.audience) && data.audience.every(role => ['student', 'admin'].includes(role)) 
          ? data.audience as UserRole[] 
          : ['student', 'admin'] as UserRole[], // Default or corrected audience
        createdAt: createdAtDate,
        updatedAt: updatedAtDate,
      };
    };

    const pinnedAnnouncements = pinnedSnapshot.docs.map(transformDoc);
    const unpinnedAnnouncements = unpinnedSnapshot.docs.map(transformDoc);
    
    console.log("getAnnouncements (server action): Announcements transformed successfully.");
    return [...pinnedAnnouncements, ...unpinnedAnnouncements];

  } catch (error) {
    console.error("Error fetching announcements from Firestore (inside catch block of getAnnouncements):");
    if (error instanceof Error) {
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      if ((error as any).code) {
        console.error("Firebase Error Code:", (error as any).code);
      }
    } else {
      console.error("Caught an error that is not an instance of Error:", error);
    }
    try {
      console.error("Full Error Object (Stringified):", JSON.stringify(error, Object.getOwnPropertyNames(error))); 
    } catch (stringifyError) {
      console.error("Could not stringify the full error object:", stringifyError);
      console.error("Original error object (raw):", error);
    }
    throw new Error("Failed to fetch announcements."); // This is the error the client component will see
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
    
