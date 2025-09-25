"use client";

import { app } from "@/lib/firebase/config";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions(app, "asia-southeast1"); // must match your region

export async function approveStudent(uid: string, approved: boolean) {
  const fn = httpsCallable(functions, "adminApproveUser");
  const res = await fn({ uid, approved });
  return res.data;
}

export async function setUserRole(uid: string, role: "student" | "admin") {
  const fn = httpsCallable(functions, "adminSetRole");
  const res = await fn({ uid, role });
  return res.data;
}
