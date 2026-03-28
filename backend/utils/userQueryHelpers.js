/**
 * Filter for users that are not soft-deleted (use in User.find / countDocuments).
 */
export const notDeletedFilter = () => ({ isDeleted: { $ne: true } });
