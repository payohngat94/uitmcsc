
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";

admin.initializeApp();

const db = admin.firestore();
const JWT_SECRET = functions.config().jwt.secret || "default-dev-secret-key";
const TOKEN_EXPIRATION_SECONDS = 120; // 2 minutes

// Helper to hash a token
const hashToken = (token: string) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * generateQrToken
 * Admin-only callable function to create a short-lived signed JWT for QR codes.
 *
 * @param {object} data - The data object from the client.
 * @param {string} data.sessionId - The ID of the session.
 * @param {'signIn' | 'signOff'} data.type - The type of QR code.
 * @param {functions.https.CallableContext} context - The context of the call.
 * @returns {Promise<{token: string}>} - A promise that resolves with the JWT.
 */
export const generateQrToken = functions.https.onCall(
    async (data, context) => {
        // 1. Authentication and Authorization
        if (!context.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "The function must be called while authenticated.",
            );
        }
        const adminDoc = await db.collection("users").doc(context.auth.uid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
            throw new functions.https.HttpsError(
                "permission-denied",
                "Only admins can generate QR tokens.",
            );
        }

        // 2. Input Validation
        const {sessionId, type} = data;
        if (!sessionId || !type || !["signIn", "signOff"].includes(type)) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Invalid arguments provided.",
            );
        }
        const sessionRef = db.collection("sessions").doc(sessionId);
        const sessionDoc = await sessionRef.get();
        if (!sessionDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Session not found.");
        }

        // 3. Token Generation
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + TOKEN_EXPIRATION_SECONDS;
        const tokenId = db.collection("tmp").doc().id; // Unique ID for the token

        const payload = {
            sessionId,
            type,
            tokenId,
            iat: now,
            exp: expiresAt,
        };
        const token = jwt.sign(payload, JWT_SECRET);
        const hashedToken = hashToken(token);

        // 4. Store Token Hash in Firestore
        const qrTokenRef = sessionRef.collection("qrTokens").doc(tokenId);
        await qrTokenRef.set({
            hashedToken,
            type,
            expiresAt: admin.firestore.Timestamp.fromMillis(expiresAt * 1000),
            isActive: true,
        });

        // 5. Return Token
        return {token};
    },
);


/**
 * scanQr
 * Student-callable function to process a QR code scan.
 *
 * @param {object} data - The data object from the client.
 * @param {string} data.token - The JWT from the QR code.
 * @param {functions.https.CallableContext} context - The context of the call.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const scanQr = functions.https.onCall(async (data, context) => {
    // 1. Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "You must be logged in to scan.",
        );
    }
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email || "Unknown Email";

    // 2. Input Validation and Token Verification
    const {token} = data;
    if (!token) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "No token provided.",
        );
    }

    let decoded: jwt.JwtPayload | string;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === "string") {
            throw new Error("Invalid token payload");
        }
    } catch (err) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid or expired token.");
    }

    // 3. Database Verification
    const {sessionId, type, tokenId} = decoded;
    const qrTokenRef = db
        .collection("sessions")
        .doc(sessionId)
        .collection("qrTokens")
        .doc(tokenId);

    const qrTokenDoc = await qrTokenRef.get();

    if (
        !qrTokenDoc.exists ||
        !qrTokenDoc.data()?.isActive ||
        qrTokenDoc.data()?.hashedToken !== hashToken(token)
    ) {
        throw new functions.https.HttpsError("not-found", "Token is invalid or has already been used.");
    }

    // 4. Process Attendance and Invalidate Token
    const attendanceCollectionRef = db.collection("sessions").doc(sessionId).collection("attendance");
    const attendanceQuery = await attendanceCollectionRef
        .where("userId", "==", userId)
        .limit(1)
        .get();

    let message = "";
    const now = admin.firestore.FieldValue.serverTimestamp();

    await db.runTransaction(async (transaction) => {
        // Invalidate the token first
        transaction.update(qrTokenRef, {isActive: false});
        let attendanceRef: admin.firestore.DocumentReference;
        let oldData: admin.firestore.DocumentData | undefined;

        if (attendanceQuery.empty) {
            // First time this user is interacting with this session
            attendanceRef = attendanceCollectionRef.doc(); // Create new doc
            if (type === "signIn") {
                transaction.set(attendanceRef, {
                    userId,
                    userEmail,
                    sessionId,
                    checkInTime: now,
                });
                message = "Sign-in successful!";
            } else {
                // Trying to sign-off without signing in
                message = "Sign-off failed: No prior sign-in found for this session.";
                return; // Exit transaction
            }
        } else {
            // User already has an attendance record
            attendanceRef = attendanceQuery.docs[0].ref;
            oldData = attendanceQuery.docs[0].data();

            if (type === "signIn") {
                if (oldData?.checkInTime) {
                    message = "You have already signed in.";
                } else {
                    transaction.update(attendanceRef, {checkInTime: now});
                    message = "Sign-in successful!";
                }
            } else { // signOff
                if (oldData?.checkOutTime) {
                    message = "You have already signed off.";
                } else if (!oldData?.checkInTime) {
                    message = "Sign-off failed: No prior sign-in found.";
                } else {
                    const checkInDate = oldData.checkInTime.toDate();
                    const checkOutDate = new Date(); // Approximate
                    const durationMs = checkOutDate.getTime() - checkInDate.getTime();
                    const durationMinutes = durationMs / 60000;

                    transaction.update(attendanceRef, {
                        checkOutTime: now,
                        durationMinutes: parseFloat(durationMinutes.toFixed(2)),
                    });
                    message = "Sign-off successful!";
                }
            }
        }
    });

    // 5. Update Aggregates (outside the main transaction for performance)
    if (message.toLowerCase().includes("successful")) {
        await updateSessionAggregates(sessionId);
    }

    return {success: true, message: message};
});

/**
 * Updates the aggregate data for a given session.
 * This is a helper function triggered after a successful scan.
 */
const updateSessionAggregates = async (sessionId: string) => {
    const attendanceCollectionRef = db.collection("sessions").doc(sessionId).collection("attendance");
    const snapshot = await attendanceCollectionRef.get();

    let headcount = 0;
    let totalMinutes = 0;

    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.checkInTime) {
            headcount++;
        }
        if (data.durationMinutes) {
            totalMinutes += data.durationMinutes;
        }
    });

    const averageMinutes = headcount > 0 ? totalMinutes / headcount : 0;
    const aggregateRef = db.collection("sessionAggregates").doc(sessionId);

    await aggregateRef.set(
        {
            headcount,
            totalMinutes: parseFloat(totalMinutes.toFixed(2)),
            averageMinutes: parseFloat(averageMinutes.toFixed(2)),
        },
        {merge: true},
    );
};
