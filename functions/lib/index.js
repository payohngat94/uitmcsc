"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanQr = exports.generateQrToken = exports.adminSetRole = exports.adminApproveUser = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const jwt = __importStar(require("jsonwebtoken"));
const crypto = __importStar(require("crypto"));
const dotenv_1 = require("dotenv");
// If you use .env.dev keep this; otherwise use config() without path
(0, dotenv_1.config)({ path: ".env.dev" });
try {
    admin.app();
}
catch {
    admin.initializeApp();
}
const db = admin.firestore();
// ----------------- Constants / Config -----------------
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAILS = ["admin@example.com", "ainuddin@uitm.edu.my"];
const QR_TOKEN_EXPIRY_MINUTES = 2;
// Helper: ensure caller is admin (by claim)
function assertAdmin(ctx) {
    if (!ctx.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    }
    const isClaimAdmin = ctx.auth.token?.role === "admin";
    if (!isClaimAdmin) {
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
exports.adminApproveUser = functions
    .region("asia-southeast1")
    .https.onCall(async (data, ctx) => {
    assertAdmin(ctx);
    const { uid, approved } = data || {};
    if (!uid || typeof approved !== "boolean") {
        throw new functions.https.HttpsError("invalid-argument", "uid and approved(boolean) required");
    }
    // Mirror to Firestore
    await db.doc(`users/${uid}`).set({
        status: approved ? "active" : "rejected",
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    // Merge with existing claims
    const target = await admin.auth().getUser(uid);
    const claims = { ...(target.customClaims || {}), approved };
    await admin.auth().setCustomUserClaims(uid, claims);
    // Force token refresh visibility
    await admin.auth().revokeRefreshTokens(uid);
    return { ok: true };
});
/**
 * Admin sets role ("student" | "admin")
 * - Sets claim role
 * - Mirrors to Firestore
 */
exports.adminSetRole = functions
    .region("asia-southeast1")
    .https.onCall(async (data, ctx) => {
    assertAdmin(ctx);
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
exports.generateQrToken = functions
    .region("asia-southeast1")
    .https.onCall(async (data, context) => {
    // 1) Auth
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    // Admin check: claim OR email allowlist
    const adminUser = await admin.auth().getUser(context.auth.uid);
    const isClaimAdmin = adminUser.customClaims?.["role"] === "admin";
    const isEmailAdmin = ADMIN_EMAILS.includes(adminUser.email || "");
    console.log("generateQrToken caller:", {
        uid: context.auth.uid,
        email: adminUser.email,
        isClaimAdmin,
        isEmailAdmin,
    });
    if (!isClaimAdmin && !isEmailAdmin) {
        throw new functions.https.HttpsError("permission-denied", "The function must be called by an admin user.");
    }
    // 2) Input
    const { sessionId, type } = data || {};
    if (!sessionId || (type !== "signIn" && type !== "signOut")) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid session ID or token type provided.");
    }
    // 3) Secret present?
    if (!JWT_SECRET) {
        console.error("FATAL: JWT_SECRET missing");
        throw new functions.https.HttpsError("internal", "The server is missing a required secret for QR generation.");
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
exports.scanQr = functions
    .region("asia-southeast1")
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const uid = context.auth.uid;
    const callingUser = await admin.auth().getUser(uid);
    const userEmail = callingUser.email || context.auth.token?.email || uid;
    // Self-heal: if allowlisted email but missing admin role, set it
    if (ADMIN_EMAILS.includes(callingUser.email || "") &&
        callingUser.customClaims?.role !== "admin") {
        try {
            await admin.auth().setCustomUserClaims(uid, { role: "admin" });
        }
        catch (e) {
            console.error("Failed to set admin claim for", callingUser.email, e);
        }
    }
    // Input
    const { token } = data || {};
    if (!token) {
        throw new functions.https.HttpsError("invalid-argument", "A token must be provided.");
    }
    if (!JWT_SECRET) {
        console.error("FATAL: JWT_SECRET missing");
        throw new functions.https.HttpsError("internal", "The server is missing a required secret for QR verification.");
    }
    // Verify
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    }
    catch {
        throw new functions.https.HttpsError("invalid-argument", "Invalid or expired token.");
    }
    const { sessionId, type } = decoded;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    // Find active token
    const tokenQuery = db
        .collection("sessions").doc(sessionId)
        .collection("qrTokens")
        .where("tokenHash", "==", tokenHash)
        .where("isActive", "==", true);
    const tokenSnapshot = await tokenQuery.get();
    if (tokenSnapshot.empty) {
        throw new functions.https.HttpsError("not-found", "QR code is invalid or has already been used.");
    }
    const tokenDoc = tokenSnapshot.docs[0];
    await tokenDoc.ref.update({ isActive: false }); // prevent reuse
    if (tokenDoc.data().expiresAt.toMillis() < Date.now()) {
        throw new functions.https.HttpsError("deadline-exceeded", "This QR code has expired.");
    }
    // Record attendance
    const attendanceRef = db.collection("attendanceLogs").doc(`${sessionId}_${uid}`);
    const attendanceDoc = await attendanceRef.get();
    const serverTime = admin.firestore.FieldValue.serverTimestamp();
    const stationDoc = await db.collection("sessions").doc(sessionId).get();
    const stationId = stationDoc.data()?.stationId || "unknown";
    if (type === "signIn") {
        if (attendanceDoc.exists && attendanceDoc.data()?.signInTime) {
            throw new functions.https.HttpsError("already-exists", "You have already signed in for this session.");
        }
        await attendanceRef.set({
            sessionId,
            stationId,
            userId: uid,
            userEmail,
            signInTime: serverTime,
            signOutTime: null,
            durationMs: null,
        }, { merge: true });
        return { message: "Sign-in successful." };
    }
    else {
        if (!attendanceDoc.exists || !attendanceDoc.data()?.signInTime) {
            throw new functions.https.HttpsError("failed-precondition", "You must sign in before you can sign out.");
        }
        if (attendanceDoc.data()?.signOutTime) {
            throw new functions.https.HttpsError("already-exists", "You have already signed out for this session.");
        }
        const signInTimestamp = attendanceDoc.data()?.signInTime;
        const durationMs = Date.now() - signInTimestamp.toMillis();
        await attendanceRef.update({
            signOutTime: serverTime,
            durationMs,
        });
        return { message: "Sign-out successful." };
    }
});
