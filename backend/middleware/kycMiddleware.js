/**
 * KYC approval gate. Use after requireAuth.
 * Returns 403 with structured error when kycStatus !== 'approved' (see auth.js requireKycApproved).
 * This file re-exports for backward compatibility.
 */
import { requireKycApproved } from './auth.js';
export const isVerified = requireKycApproved;
