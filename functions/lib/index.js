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
exports.scanQr = exports.generateQrToken = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const jwt = __importStar(require("jsonwebtoken"));
const crypto = __importStar(require("crypto"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: ".env.dev" });
admin.initializeApp();
const db = admin.firestore();
// IMPORTANT: The JWT_SECRET is now managed by .env files or Firebase config.
// For local dev, your secret is in /functions/.env
// For production, it's set via `firebase functions:config:set jwt.secret="..."`
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAILS = ['admin@example.com', 'ainuddin@uitm.edu.my'];
const QR_TOKEN_EXPIRY_MINUTES = 2;
/**
 * Generates a short-lived QR code token for a specific session.
 * Only callable by users with an 'admin' custom claim.
 */
exports.generateQrToken = functions
    .region("asia-southeast1") // Specify your region
    .https.onCall(async (data, context) => {
    // 1. Authentication and Authorization
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const adminUser = await admin.auth().getUser(context.auth.uid);
    if (adminUser.customClaims?.["role"] !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "The function must be called by an admin user.");
    }
    // 2. Input Validation
    const { sessionId, type } = data;
    if (!sessionId || (type !== "signIn" && type !== "signOut")) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid session ID or token type provided.");
    }
    // 3. Secret Key Check (Robust Guard Clause)
    if (!JWT_SECRET) {
        console.error("FATAL ERROR: JWT_SECRET not found in environment variables.");
        throw new functions.https.HttpsError("internal", "The server is missing a required secret for QR generation.");
    }
    // 4. Token Generation
    const expiry = Math.floor(Date.now() / 1000) + QR_TOKEN_EXPIRY_MINUTES * 60;
    const payload = {
        sessionId: sessionId,
        type: type,
        exp: expiry,
    };
    const token = jwt.sign(payload, JWT_SECRET);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    // 5. Store Token Hash in Firestore
    const tokenRef = db
        .collection("sessions")
        .doc(sessionId)
        .collection("qrTokens")
        .doc();
    await tokenRef.set({
        tokenHash: tokenHash,
        type: type,
        expiresAt: admin.firestore.Timestamp.fromMillis(expiry * 1000),
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // 6. Return URL for QR code
    // IMPORTANT: Replace with your actual deployed app URL
    const baseUrl = "https://your-app-url.web.app/attendance";
    const qrUrl = `${baseUrl}?token=${token}`;
    return { qrUrl: qrUrl };
});
/**
 * Processes a QR code scan, verifies the token, and records attendance.
 * Callable by any authenticated user.
 */
exports.scanQr = functions
    .region("asia-southeast1") // Specify your region
    .https.onCall(async (data, context) => {
    // 1. Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { uid, token: userEmail } = context.auth;
    const callingUser = await admin.auth().getUser(uid);
    // --- SELF-HEALING ADMIN CLAIM ---
    // Check if the user is a designated admin and if their claim is missing
    if (ADMIN_EMAILS.includes(callingUser.email || "") && callingUser.customClaims?.role !== 'admin') {
        console.log(`User ${callingUser.email} is an admin but lacks the 'admin' custom claim. Setting it now.`);
        try {
            await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
            console.log(`Successfully set 'admin' claim for ${callingUser.email}. They should re-authenticate to see the effect.`);
        }
        catch (claimError) {
            console.error(`Failed to set custom claim for admin user ${callingUser.email}.`, claimError);
        }
    }
    // --- END SELF-HEALING ---
    // 2. Input Validation
    const { token } = data;
    if (!token) {
        throw new functions.https.HttpsError("invalid-argument", "A token must be provided.");
    }
    // 3. Secret Key Check (Robust Guard Clause)
    if (!JWT_SECRET) {
        console.error("FATAL ERROR: JWT_SECRET not found in environment variables.");
        throw new functions.https.HttpsError("internal", "The server is missing a required secret for QR verification.");
    }
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid or expired token.");
    }
    const { sessionId, type } = decoded;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const tokenQuery = db
        .collection("sessions")
        .doc(sessionId)
        .collection("qrTokens")
        .where("tokenHash", "==", tokenHash)
        .where("isActive", "==", true);
    const tokenSnapshot = await tokenQuery.get();
    if (tokenSnapshot.empty) {
        throw new functions.https.HttpsError("not-found", "QR code is invalid or has already been used.");
    }
    const tokenDoc = tokenSnapshot.docs[0];
    // Deactivate token immediately to prevent reuse
    await tokenDoc.ref.update({ isActive: false });
    if (tokenDoc.data().expiresAt.toMillis() < Date.now()) {
        throw new functions.https.HttpsError("deadline-exceeded", "This QR code has expired.");
    }
    // --- Record Attendance ---
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
            sessionId: sessionId,
            stationId: stationId,
            userId: uid,
            userEmail: userEmail || uid,
            signInTime: serverTime,
            signOutTime: null,
            durationMs: null,
        }, { merge: true });
        return { message: "Sign-in successful." };
    }
    else { // Sign-out
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
            durationMs: durationMs,
        });
        // Optional: Update aggregate collections here
        return { message: "Sign-out successful." };
    }
});
