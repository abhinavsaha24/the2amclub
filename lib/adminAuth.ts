"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "admin_location_id";

export async function setAdminSession(locationId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return session?.value || null;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
