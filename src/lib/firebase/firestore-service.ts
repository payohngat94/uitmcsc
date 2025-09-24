

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
  writeBatch,
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
  UserStatus,
  Topic,
  ContentItem,
  Station,
  Session,
  AttendanceRecord
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

export async function approveAllPendingUsers(): Promise<string[]> {
  const batch = writeBatch(db);
  const q = query(usersCollectionRef, where("status", "==", "pending"));
  const updatedDocIds: string[] = [];

  try {
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(document => {
      batch.update(document.ref, { status: 'active' });
      updatedDocIds.push(document.id);
    });
    await batch.commit();
    return updatedDocIds;
  } catch (error) {
    console.error("Error approving all pending users:", error);
    throw new Error(`Failed to approve all pending users. ${(error as Error).message}`);
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


// --- New Learning Materials Service (Topics / ContentItems) ---
const topicsCollectionRef = collection(db, 'topics');
const contentItemsCollectionRef = collection(db, 'contentItems');
const categoriesCollectionRef = collection(db, 'learningMaterialCategories');

// Helper function to update topic summary
async function updateTopicSummary(topicId: string) {
  const q = query(contentItemsCollectionRef, where("topicId", "==", topicId));
  const contentItemsSnapshot = await getDocs(q);
  
  let videoCount = 0;
  let documentCount = 0;
  let slidesCount = 0;

  contentItemsSnapshot.forEach(doc => {
    const item = doc.data() as ContentItem;
    if (item.type === 'video') videoCount++;
    if (item.type === 'document') documentCount++;
    if (item.type === 'slides') slidesCount++;
  });

  const resourceSummary = {
    videoCount,
    documentCount,
    slidesCount,
    hasVideo: videoCount > 0,
    hasDocument: documentCount > 0,
    hasSlides: slidesCount > 0,
  };
  
  const topicRef = doc(db, 'topics', topicId);
  await updateDoc(topicRef, { resourceSummary });
}


export async function getTopics(): Promise<Topic[]> {
  const q = query(topicsCollectionRef, orderBy('title', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate(),
      resourceSummary: data.resourceSummary || { videoCount: 0, documentCount: 0, slidesCount: 0, hasVideo: false, hasDocument: false, hasSlides: false },
      contentItems: [], // Initialize empty, will be populated on client
    } as Topic
  });
}

export async function getContentItems(): Promise<ContentItem[]> {
  const q = query(contentItemsCollectionRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
    updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
  } as ContentItem));
}

export async function addTopic(
  topicData: Omit<Topic, 'id' | 'createdAt' | 'updatedAt' | 'resourceSummary' | 'contentItems'>
): Promise<string> {
  const docRef = await addDoc(topicsCollectionRef, {
    ...topicData,
    resourceSummary: { videoCount: 0, documentCount: 0, slidesCount: 0, hasVideo: false, hasDocument: false, hasSlides: false },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTopic(id: string, topicData: Partial<Topic>): Promise<void> {
  const topicRef = doc(db, 'topics', id);
  await updateDoc(topicRef, { ...topicData, updatedAt: serverTimestamp() });
}

export async function deleteTopic(id: string): Promise<void> {
  const batch = writeBatch(db);
  
  // Delete the topic itself
  const topicRef = doc(db, 'topics', id);
  batch.delete(topicRef);

  // Find and delete all associated content items
  const q = query(contentItemsCollectionRef, where("topicId", "==", id));
  const contentItemsSnapshot = await getDocs(q);
  contentItemsSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

export async function addContentItem(
  contentData: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(contentItemsCollectionRef, {
    ...contentData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Update the parent topic's summary
  await updateTopicSummary(contentData.topicId);
  return docRef.id;
}

export async function updateContentItem(id: string, contentData: Partial<ContentItem>): Promise<void> {
  const contentItemRef = doc(db, 'contentItems', id);
  await updateDoc(contentItemRef, { ...contentData, updatedAt: serverTimestamp() });
  // If topicId is part of the update, we might need to update two topics, but for now, we assume it's not changing.
  // We still need to fetch the full item to get topicId for summary update.
  const updatedDoc = await getDoc(contentItemRef);
  const topicId = updatedDoc.data()?.topicId;
  if (topicId) {
    await updateTopicSummary(topicId);
  }
}

export async function deleteContentItem(id: string): Promise<void> {
  const contentItemRef = doc(db, 'contentItems', id);
  const docSnapshot = await getDoc(contentItemRef);
  const topicId = docSnapshot.data()?.topicId;
  
  await deleteDoc(contentItemRef);

  if (topicId) {
    await updateTopicSummary(topicId);
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
    throw new Error(`Failed to add inventory item. ${(error as Error).message}`);
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
    throw new Error(`Failed to update inventory item. ${(error as Error).message}`);
  }
}

export async function deleteInventoryItem(id: string): Promise<void>
{
  try {
    const itemDocRef = doc(db, 'inventoryItems', id);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error("Error deleting inventory item: ", error);
    throw new Error(`Failed to delete inventory item. ${(error as Error).message}`);
  }
}


// --- ATTENDANCE TRACKING SERVICE ---
const stationsCollectionRef = collection(db, 'stations');
const sessionsCollectionRef = collection(db, 'sessions');
const attendanceLogsCollectionRef = collection(db, 'attendanceLogs');

export async function addStation(stationData: Omit<Station, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(stationsCollectionRef, {
    ...stationData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getStations(): Promise<Station[]> {
  const q = query(stationsCollectionRef, orderBy('name', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
  } as Station));
}

export async function addSession(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(sessionsCollectionRef, {
    ...sessionData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getSessionsWithAttendance(): Promise<Array<Session & { attendance: AttendanceRecord[] }>> {
  const sessionQuery = query(sessionsCollectionRef, orderBy('sessionDate', 'desc'));
  const sessionsSnapshot = await getDocs(sessionQuery);
  const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sessionDate: (doc.data().sessionDate as Timestamp).toDate(),
      startTime: (doc.data().startTime as Timestamp).toDate(),
      endTime: (doc.data().endTime as Timestamp).toDate(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
  } as Session));

  const attendanceQuery = query(attendanceLogsCollectionRef, orderBy('signInTime', 'desc'));
  const attendanceSnapshot = await getDocs(attendanceQuery);
  const allAttendance = attendanceSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      signInTime: doc.data().signInTime ? (doc.data().signInTime as Timestamp).toDate() : null,
      signOutTime: doc.data().signOutTime ? (doc.data().signOutTime as Timestamp).toDate() : null,
  } as AttendanceRecord));

  // Combine sessions with their attendance records
  return sessions.map(session => ({
      ...session,
      attendance: allAttendance.filter(att => att.sessionId === session.id)
  }));
}

export async function getStudentAttendance(userId: string): Promise<AttendanceRecord[]> {
    const q = query(attendanceLogsCollectionRef, where("userId", "==", userId), orderBy("signInTime", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        signInTime: doc.data().signInTime ? (doc.data().signInTime as Timestamp).toDate() : null,
        signOutTime: doc.data().signOutTime ? (doc.data().signOutTime as Timestamp).toDate() : null,
    } as AttendanceRecord));
}

// --- Deprecated Learning Material functions ---
const materialsCollectionRef = collection(db, 'learningMaterials');

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
