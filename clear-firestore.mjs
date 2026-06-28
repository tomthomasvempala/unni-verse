#!/usr/bin/env node
// clear-firestore.mjs — Delete ALL documents from every collection in Firestore.
// Usage: node clear-firestore.mjs
// Requires: firebase-admin  →  npm install -D firebase-admin
//
// Authentication: uses Application Default Credentials.
// Run once before executing this script:
//   firebase login --reauth          (if using Firebase CLI credentials)
// OR set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON key file.

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'unni-verse';

// Collections to wipe — add/remove as needed
const COLLECTIONS = [
  'users',
  'loans',
  'transactions',
  'dailyBalances',
  'moneyRequests',
  'government',
];

const BATCH_SIZE = 400; // Firestore max batch size is 500

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore();

async function deleteCollection(collectionName) {
  const ref = db.collection(collectionName);
  let deleted = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await ref.limit(BATCH_SIZE).get();
    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snap.size;
    process.stdout.write(`  ${collectionName}: deleted ${deleted} docs...\r`);
  }

  console.log(`  ${collectionName}: deleted ${deleted} docs.    `);
}

console.log(`\nClearing Firestore project: ${PROJECT_ID}\n`);

for (const col of COLLECTIONS) {
  await deleteCollection(col);
}

console.log('\nDone — Firestore is empty.\n');
