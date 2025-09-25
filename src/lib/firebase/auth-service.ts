import { auth } from "./config";
import { db } from "./config";
import {
  doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { getIdToken, getIdTokenResult, type User as FirebaseUser } from "firebase/auth";

const usersCol = collection(db, "users");
const ADMIN_EMAILS = ["admin@example.com", "ainuddin@uitm.edu.my"];

export async function ensureUserDocumentOnAuth(user: FirebaseUser, studentOrStaffId = ""): Promise<void> {
  const uid = user.uid;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  // merge any placeholder by email
  let placeholderData: any = {};
  let placeholderId: string | null = null;
  if (user.email) {
    const q = query(usersCol, where("email", "==", user.email));
    const found = await getDocs(q);
    if (!found.empty && found.docs[0].id !== uid) {
      placeholderId = found.docs[0].id;
      placeholderData = found.docs[0].data();
    }
  }

  const isAdminEmail = ADMIN_EMAILS.includes(user.email || "");
  const base = {
    uid,
    email: user.email || "",
    displayName: user.displayName || studentOrStaffId || user.email || uid,
    studentOrStaffId,
    role: isAdminEmail ? "admin" : "student",
    status: isAdminEmail ? "active" : "pending",
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, { ...placeholderData, ...base }, { merge: true });
  if (placeholderId) await deleteDoc(doc(db, "users", placeholderId));
}

export async function refreshApprovalState(user: FirebaseUser) {
  await getIdToken(user, true); // force fresh claims
  const tok = await getIdTokenResult(user);
  return {
    approvedClaim: !!tok.claims.approved,
    roleClaim: (tok.claims.role as string) || "student",
  };
}
