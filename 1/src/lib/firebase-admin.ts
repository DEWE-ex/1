import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";

let adminApp: App | undefined;
let adminDb: Database | undefined;

function initAdmin(): App {
  if (adminApp) return adminApp;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON chưa được cấu hình trong .env"
    );
  }

  const serviceAccount = JSON.parse(json);
  adminApp =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert(serviceAccount),
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });

  return adminApp;
}

export function getAdminDb(): Database {
  if (!adminDb) {
    adminDb = getDatabase(initAdmin());
  }
  return adminDb;
}
