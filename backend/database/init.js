/**
 * Legacy database init stub.
 * Auth and user management use MongoDB (see server.js). This file exists so
 * any import of ./database/init.js does not cause ERR_MODULE_NOT_FOUND.
 * Returns a resolved promise; no SQLite or other DB is required for the app.
 */
const initDb = async () => {
    return null;
};

export default initDb;
