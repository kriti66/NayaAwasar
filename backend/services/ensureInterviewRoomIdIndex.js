import Interview from '../models/Interview.js';

function isSafeToIgnoreDropError(err) {
    if (!err) return false;
    const msg = String(err.message || '');
    if (err.codeName === 'IndexNotFound' || err.codeName === 'NamespaceNotFound') return true;
    if (/index not found/i.test(msg) || /ns not found/i.test(msg)) return true;
    return false;
}

/**
 * Drops legacy non-sparse unique index on roomId (E11000 dup on null for onsite rows),
 * then recreates indexes from the Interview schema (sparse unique roomId).
 */
export async function ensureInterviewRoomIdSparseIndex() {
    const coll = Interview.collection;
    try {
        await coll.dropIndex('roomId_1');
        console.log('[interviews] dropped legacy index roomId_1; recreating sparse unique index');
    } catch (err) {
        if (!isSafeToIgnoreDropError(err)) throw err;
    }
    await Interview.syncIndexes();
}
