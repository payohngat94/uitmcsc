
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
  writeBatch,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { 
  Announcement, 
  UserRole, 
  InventoryItem, 
  UserProfile, 
  UserStatus,
  Topic,
  ContentItem,
  ContentItemType,
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


// --- NEW LEARNING TOPICS / CONTENT ITEMS SERVICE ---
const topicsCollectionRef = collection(db, 'topics');
const contentItemsCollectionRef = collection(db, 'contentItems');

export async function getTopics(): Promise<Topic[]> {
    try {
        const q = query(topicsCollectionRef, orderBy('title', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docSnapshot => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
            createdAt: (docSnapshot.data().createdAt as Timestamp)?.toDate(),
            updatedAt: (docSnapshot.data().updatedAt as Timestamp)?.toDate(),
        } as Topic));
    } catch (error) {
        console.error("Error fetching topics:", error);
        throw new Error(`Failed to fetch topics. ${(error as Error).message}`);
    }
}

export async function addTopic(topicData: Omit<Topic, 'id' | 'createdAt' | 'updatedAt' | 'resourceSummary'>): Promise<string> {
    try {
        const docRef = await addDoc(topicsCollectionRef, {
            ...topicData,
            resourceSummary: { // Initialize empty summary
                hasVideo: false, hasDocument: false, hasSlides: false,
                videoCount: 0, documentCount: 0, slidesCount: 0,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding topic:", error);
        throw new Error(`Failed to add topic. ${(error as Error).message}`);
    }
}

export async function updateTopic(id: string, topicData: Partial<Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
        const topicDocRef = doc(db, 'topics', id);
        await updateDoc(topicDocRef, {
            ...topicData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating topic:", error);
        throw new Error(`Failed to update topic. ${(error as Error).message}`);
    }
}

export async function deleteTopic(id: string): Promise<void> {
    const topicDocRef = doc(db, 'topics', id);
    const contentItemsQuery = query(contentItemsCollectionRef, where("topicId", "==", id));
    
    try {
        const batch = writeBatch(db);

        // Delete all associated content items
        const contentItemsSnapshot = await getDocs(contentItemsQuery);
        contentItemsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete the topic itself
        batch.delete(topicDocRef);

        await batch.commit();
    } catch (error) {
        console.error("Error deleting topic and its content:", error);
        throw new Error(`Failed to delete topic. ${(error as Error).message}`);
    }
}


export async function getContentItemsForTopic(topicId: string, type?: ContentItemType): Promise<ContentItem[]> {
    try {
        let q = query(contentItemsCollectionRef, where("topicId", "==", topicId), orderBy('createdAt', 'desc'));
        if (type) {
            q = query(contentItemsCollectionRef, where("topicId", "==", topicId), where("type", "==", type), orderBy('createdAt', 'desc'));
        }
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docSnapshot => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
            createdAt: (docSnapshot.data().createdAt as Timestamp)?.toDate(),
            updatedAt: (docSnapshot.data().updatedAt as Timestamp)?.toDate(),
        } as ContentItem));
    } catch (error) {
        console.error("Error fetching content items:", error);
        throw new Error(`Failed to fetch content items for topic ${topicId}. ${(error as Error).message}`);
    }
}


export async function addContentItem(itemData: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const topicDocRef = doc(db, 'topics', itemData.topicId);

    try {
        let newContentItemId = "";
        await runTransaction(db, async (transaction) => {
            const topicDoc = await transaction.get(topicDocRef);
            if (!topicDoc.exists()) {
                throw new Error("Topic not found!");
            }

            // 1. Add the new content item
            const newContentItemRef = doc(collection(db, "contentItems"));
            transaction.set(newContentItemRef, {
                ...itemData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            newContentItemId = newContentItemRef.id;

            // 2. Update the topic's resource summary
            const summary = topicDoc.data().resourceSummary;
            const type = itemData.type;
            if (type === 'video') {
                summary.hasVideo = true;
                summary.videoCount = (summary.videoCount || 0) + 1;
            } else if (type === 'document') {
                summary.hasDocument = true;
                summary.documentCount = (summary.documentCount || 0) + 1;
            } else if (type === 'slides') {
                summary.hasSlides = true;
                summary.slidesCount = (summary.slidesCount || 0) + 1;
            }
            
            transaction.update(topicDocRef, { resourceSummary: summary, updatedAt: serverTimestamp() });
        });
        return newContentItemId;
    } catch (error) {
        console.error("Error adding content item:", error);
        throw new Error(`Failed to add content item. ${(error as Error).message}`);
    }
}


export async function deleteContentItem(item: ContentItem): Promise<void> {
    const itemDocRef = doc(db, 'contentItems', item.id);
    const topicDocRef = doc(db, 'topics', item.topicId);

    try {
         await runTransaction(db, async (transaction) => {
            const topicDoc = await transaction.get(topicDocRef);
            if (!topicDoc.exists()) {
                // Topic might have been deleted already, so just delete the item.
                transaction.delete(itemDocRef);
                return;
            }
            
            // 1. Delete the content item
            transaction.delete(itemDocRef);

            // 2. Decrement the topic's resource summary
            const summary = topicDoc.data().resourceSummary;
            const type = item.type;
            let shouldUpdateSummary = false;

            if (type === 'video' && summary.videoCount > 0) {
                summary.videoCount -= 1;
                if (summary.videoCount === 0) summary.hasVideo = false;
                shouldUpdateSummary = true;
            } else if (type === 'document' && summary.documentCount > 0) {
                summary.documentCount -= 1;
                if (summary.documentCount === 0) summary.hasDocument = false;
                shouldUpdateSummary = true;
            } else if (type === 'slides' && summary.slidesCount > 0) {
                summary.slidesCount -= 1;
                if (summary.slidesCount === 0) summary.hasSlides = false;
                shouldUpdateSummary = true;
            }
            
            if (shouldUpdateSummary) {
                transaction.update(topicDocRef, { resourceSummary: summary, updatedAt: serverTimestamp() });
            }
        });
    } catch (error) {
        console.error("Error deleting content item:", error);
        throw new Error(`Failed to delete content item. ${(error as Error).message}`);
    }
}

export async function updateContentItem(id: string, itemData: Partial<Omit<ContentItem, 'id'>>): Promise<void> {
    // This function does not handle changing the topicId or type, as that would require complex summary updates.
    // It's for updating details like title, url, description etc.
    try {
        const itemDocRef = doc(db, 'contentItems', id);
        await updateDoc(itemDocRef, {
            ...itemData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating content item:", error);
        throw new Error(`Failed to update content item. ${(error as Error).message}`);
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
    throw new Error(`Failed to delete inventory item. ${(error as Error).message}`);
  }
}
