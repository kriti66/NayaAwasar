/**
 * Role-based KYC validation.
 * Returns { valid: boolean, message?: string }.
 */

export function validateJobSeekerKYC(body) {
    const {
        fullName,
        dateOfBirth,
        nationality,
        address,
        idType,
        idNumber,
        documentFront,
        documentBack
    } = body;

    if (!fullName?.trim()) return { valid: false, message: 'Full name is required' };
    if (!dateOfBirth) return { valid: false, message: 'Date of birth is required' };
    if (!nationality?.trim()) return { valid: false, message: 'Nationality is required' };
    if (!address?.trim()) return { valid: false, message: 'Address is required' };
    if (!idType || !['citizenship', 'passport', 'national_id'].includes(idType)) {
        return { valid: false, message: 'Valid ID type is required (citizenship, passport, national_id)' };
    }
    if (!idNumber?.trim()) return { valid: false, message: 'ID number is required' };
    if (!documentFront) return { valid: false, message: 'Document front (ID front) is required' };
    if (!documentBack) return { valid: false, message: 'Document back (ID back) is required' };

    return { valid: true };
}

export function validateRecruiterKYC(body) {
    const {
        fullName,
        jobTitle,
        officialEmail,
        phoneNumber,
        companyName,
        registrationNumber,
        industry,
        companyAddress,
        registrationDocument,
        taxDocument,
        idType,
        idNumber,
        idFront,
        idBack
    } = body;

    if (!fullName?.trim()) return { valid: false, message: 'Full name is required' };
    if (!jobTitle?.trim()) return { valid: false, message: 'Job title is required' };
    if (!officialEmail?.trim()) return { valid: false, message: 'Official email is required' };
    if (!phoneNumber?.trim()) return { valid: false, message: 'Phone number is required' };
    if (!companyName?.trim()) return { valid: false, message: 'Company name is required' };
    if (!registrationNumber?.trim()) return { valid: false, message: 'Registration number is required' };
    if (!industry?.trim()) return { valid: false, message: 'Industry is required' };
    if (!companyAddress?.trim()) return { valid: false, message: 'Company address is required' };
    if (!registrationDocument) return { valid: false, message: 'Registration document is required' };
    if (!taxDocument) return { valid: false, message: 'Tax document is required' };
    if (!idType || !['citizenship', 'passport', 'national_id'].includes(idType)) {
        return { valid: false, message: 'Valid ID type is required' };
    }
    if (!idNumber?.trim()) return { valid: false, message: 'ID number is required' };
    if (!idFront) return { valid: false, message: 'ID front document is required' };
    if (!idBack) return { valid: false, message: 'ID back document is required' };

    return { valid: true };
}
