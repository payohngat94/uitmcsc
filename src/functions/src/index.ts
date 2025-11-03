

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { config } from "dotenv";

// If you use .env.dev keep this; otherwise use config() without path
config({ path: ".env.dev" });

try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();

// ----------------- Constants / Config -----------------
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAILS = ["admin@example.com", "ainuddin@uitm.edu.my"];
const QR_TOKEN_EXPIRY_MINUTES = 2;

// Helper: ensure caller is admin (by claim)
async function assertAdmin(ctx: functions.https.CallableContext) {
  if (!ctx.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required");
  }

  const uid = ctx.auth.uid;
  const user = await admin.auth().getUser(uid);

  const isClaimAdmin = (ctx.auth.token as any)?.role === "admin";
  const isEmailAdmin = ADMIN_EMAILS.includes(user.email || "");

  // Self-heal if email is in allowlist but claim missing
  if (isEmailAdmin && !isClaimAdmin) {
    await admin.auth().setCustomUserClaims(uid, { ...(user.customClaims || {}), role: "admin", approved: true });
    await admin.auth().revokeRefreshTokens(uid);
    // On the first run, this will still fail because the token isn't fresh.
    // Throw a specific error telling the user to retry.
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin permissions were just updated. Please close this dialog and try again in a moment."
    );
  }

  if (!isClaimAdmin && !isEmailAdmin) {
    throw new functions.https.HttpsError("permission-denied", "Admin only");
  }
}


// =============== Admin management callables ===============

/**
 * Admin approves / blocks a user.
 * - Sets Firestore: /users/{uid}.status = "active" | "rejected"
 * - Sets custom claim: approved: boolean
 * - Revokes refresh tokens so the change shows up next login/refresh
 */
export const adminApproveUser = functions
  .region("asia-southeast1")
  .https.onCall(async (data, ctx) => {
    await assertAdmin(ctx);

    const { uid, approved, role } = data || {};
    if (!uid || typeof approved !== "boolean") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "uid and approved(boolean) required"
      );
    }

    const target = await admin.auth().getUser(uid);
    const newRole = role || (target.customClaims?.role as string) || "student";

    // 1) Update Firestore
    await db.doc(`users/${uid}`).set(
      {
        status: approved ? "active" : "rejected",
        role: newRole,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 2) Update custom claims
    const claims = {
      ...(target.customClaims || {}),
      approved,
      role: newRole,
    };
    await admin.auth().setCustomUserClaims(uid, claims);

    // 3) Force refresh
    await admin.auth().revokeRefreshTokens(uid);

    return { ok: true };
  });


/**
 * Admin sets role ("student" | "admin")
 * - Sets claim role
 * - Mirrors to Firestore
 */
export const adminSetRole = functions
  .region("asia-southeast1")
  .https.onCall(async (data, ctx) => {
    await assertAdmin(ctx);
    const { uid, role } = data || {};
    if (!uid || (role !== "student" && role !== "admin")) {
      throw new functions.https.HttpsError("invalid-argument", "uid and role(student|admin) required");
    }

    const target = await admin.auth().getUser(uid);
    const claims = { ...(target.customClaims || {}), role };
    await admin.auth().setCustomUserClaims(uid, claims);
    await db.doc(`users/${uid}`).set({ role }, { merge: true });
    await admin.auth().revokeRefreshTokens(uid);
    return { ok: true };
  });

// =============== QR generation & scanning (your code) ===============

/**
 * Generates a short-lived QR code token for a specific session.
 * Only callable by users with admin rights (claim OR email allowlist).
 */
export const generateQrToken = functions
  .region("asia-southeast1")
  .https.onCall(async (data, context) => {
    // 1) Auth & Admin Check
    await assertAdmin(context);

    // 2) Input
    const { sessionId, type } = data || {};
    if (!sessionId || (type !== "signIn" && type !== "signOut")) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid session ID or token type provided."
      );
    }

    // 3) Secret present?
    if (!JWT_SECRET) {
      console.error("FATAL: JWT_SECRET missing");
      throw new functions.https.HttpsError(
        "internal",
        "The server is missing a required secret for QR generation."
      );
    }

    // 4) Token
    const expiry = Math.floor(Date.now() / 1000) + QR_TOKEN_EXPIRY_MINUTES * 60;
    const payload = { sessionId, type, exp: expiry };
    const token = jwt.sign(payload, JWT_SECRET);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 5) Store hash
    const tokenRef = db.collection("sessions").doc(sessionId).collection("qrTokens").doc();
    await tokenRef.set({
      tokenHash,
      type,
      expiresAt: admin.firestore.Timestamp.fromMillis(expiry * 1000),
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 6) Return URL for QR
    const baseUrl = "https://studio--uitm-csc.us-central1.hosted.app/attendance"; // <-- your deployed app URL
    const qrUrl = `${baseUrl}?token=${token}`;
    return { qrUrl };
  });

/**
 * Verifies the token and records attendance.
 * Callable by any authenticated user.
 */
export const scanQr = functions
  .region("asia-southeast1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const uid = context.auth.uid;
    const callingUser = await admin.auth().getUser(uid);
    const userEmail =
      callingUser.email || (context.auth.token as any)?.email || uid;

    // Self-heal: if allowlisted email but missing admin role, set it
    if (
      ADMIN_EMAILS.includes(callingUser.email || "") &&
      callingUser.customClaims?.role !== "admin"
    ) {
      try {
        await admin.auth().setCustomUserClaims(uid, { ...(callingUser.customClaims || {}), role: "admin" });
        await admin.auth().revokeRefreshTokens(uid);
      } catch (e) {
        console.error("Failed to self-heal admin claim for", callingUser.email, e);
      }
    }

    // Input
    const { token, practicedStations } = data || {}; // <-- practicedStations added
    if (!token) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A token must be provided."
      );
    }

    if (!JWT_SECRET) {
      console.error("FATAL: JWT_SECRET missing");
      throw new functions.https.HttpsError(
        "internal",
        "The server is missing a required secret for QR verification."
      );
    }

    // Verify
    let decoded: { sessionId: string; type: "signIn" | "signOut"; exp: number };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid or expired token."
      );
    }

    const { sessionId, type } = decoded;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const txResult = await db.runTransaction(async (transaction) => {
      // 1. Find and deactivate the QR token to prevent reuse
      const tokenQuery = db
        .collection("sessions").doc(sessionId)
        .collection("qrTokens")
        .where("tokenHash", "==", tokenHash)
        .where("isActive", "==", true);

      const tokenSnapshot = await transaction.get(tokenQuery);

      if (tokenSnapshot.empty) {
        throw new functions.https.HttpsError("not-found", "QR code is invalid or has already been used.");
      }

      const tokenDoc = tokenSnapshot.docs[0];
      if (tokenDoc.data().expiresAt.toMillis() < Date.now()) {
        transaction.update(tokenDoc.ref, { isActive: false }); // Deactivate expired token
        throw new functions.https.HttpsError("deadline-exceeded", "This QR code has expired.");
      }
      
      transaction.update(tokenDoc.ref, { isActive: false });

      // 2. Fetch the session document to get the stationName (Rotation Name)
      const sessionDocRef = db.collection("sessions").doc(sessionId);
      const sessionDoc = await transaction.get(sessionDocRef);
      if (!sessionDoc.exists) {
          throw new functions.https.HttpsError("not-found", "Session details could not be found.");
      }
      const stationName = sessionDoc.data()?.stationName || "Unknown Station";
      const stationId = sessionDoc.id;

      // 3. Get reference to the user's attendance log for this session
      const attendanceRef = db.collection("attendanceLogs").doc(`${sessionId}_${uid}`);
      const attendanceDoc = await transaction.get(attendanceRef);

      // --- SIGN IN LOGIC ---
      if (type === "signIn") {
        if (attendanceDoc.exists && attendanceDoc.data()?.signInTime) {
          throw new functions.https.HttpsError("already-exists", "You have already signed in for this session.");
        }
        
        transaction.set(attendanceRef, {
          sessionId,
          stationId,
          stationName,
          userId: uid,
          userEmail,
          signInTime: admin.firestore.FieldValue.serverTimestamp(),
          signOutTime: null,
          durationMs: null,
          practicedStations: [],
        }, { merge: true });

        return {
          message: "Sign-in successful.",
          sessionId, stationId, stationName, type: "signIn",
        };
      } 
      // --- SIGN OUT LOGIC ---
      else {
        if (!attendanceDoc.exists || !attendanceDoc.data()?.signInTime) {
          throw new functions.https.HttpsError("failed-precondition", "You must sign in before you can sign out.");
        }
        if (attendanceDoc.data()?.signOutTime) {
          throw new functions.https.HttpsError("already-exists", "You have already signed out for this session.");
        }

        const signInTimestamp = attendanceDoc.data()?.signInTime as admin.firestore.Timestamp;
        const durationMs = Date.now() - signInTimestamp.toMillis();
        
        const finalPracticedStations = Array.isArray(practicedStations) ? practicedStations : [];
        
        // BACKEND FIX: Use .set with { merge: true } for a safe write
        transaction.set(attendanceRef, {
            signOutTime: admin.firestore.FieldValue.serverTimestamp(),
            durationMs,
            practicedStations: finalPracticedStations,
        }, { merge: true });

        return {
          message: "Sign-out successful.",
          sessionId,
          stationId,
          stationName,
          type: "signOut",
          practicedStations: finalPracticedStations,
        };
      }
    });

    return txResult;
  });
    




