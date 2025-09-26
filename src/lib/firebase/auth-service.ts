import { auth, db } from "./config";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getIdToken,
  getIdTokenResult,
  type User as FirebaseUser,
} from "firebase/auth";

const usersCol = collection(db, "users");
const ADMIN_EMAILS = ["admin@example.com", "ainuddin@uitm.edu.my"];

export async function ensureUserDocumentOnAuth(
  user: FirebaseUser,
  studentOrStaffId = ""
): Promise<void> {
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
  const existingData = snap.exists() ? snap.data() : {};

  // 🔹 Guest handling: force guest role/active
  if (user.isAnonymous) {
    await setDoc(
      ref,
      {
        uid,
        email: null,
        displayName: "Guest",
        studentOrStaffId: "",
        role: "guest",
        status: "active",
        createdAt: existingData?.createdAt || serverTimestamp(),
      },
      { merge: true }
    );
    if (placeholderId) await deleteDoc(doc(db, "users", placeholderId));
    return;
  }

  // 🔹 Preserve status/role if already set, don’t overwrite approved users
  const finalRole =
    isAdminEmail ? "admin" : (existingData?.role || "student");

  const finalStatus =
    existingData?.status ??
    (isAdminEmail ? "active" : "pending");

  const base = {
    uid,
    email: user.email || "",
    displayName:
      user.displayName || studentOrStaffId || user.email || uid,
    studentOrStaffId,
    role: finalRole,
    status: finalStatus,
    createdAt: existingData?.createdAt || serverTimestamp(),
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
