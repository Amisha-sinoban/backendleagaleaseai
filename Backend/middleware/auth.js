const admin = require('../firebaseAdmin');

module.exports = async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing Bearer token' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    // Attach useful user fields to request
    req.user = {
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || decoded.displayName || '',
      picture: decoded.picture || '',
      emailVerified: !!decoded.email_verified,
    };
    next();
  } catch (err) {
    console.error('Auth verification failed:', err && err.message ? err.message : err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

// Google Sign-In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("User logged in:", result.user);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    return null;
  }
};

// Logout
export const logOut = async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
  } catch (error) {
    console.error("Logout error:", error);
  }
};
