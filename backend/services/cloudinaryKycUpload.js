import cloudinary from '../config/cloudinary.js';

const KYC_DOCUMENT_ROOT = 'naya-awasar/kyc-documents';

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']);

/**
 * Multipart field → subfolder under naya-awasar/kyc-documents (POST /upload/kyc).
 */
export const UPLOAD_KYC_FIELD_FOLDER = {
    representativePhoto: 'representative',
    idFront: 'id-front',
    idBack: 'id-back',
    registrationDocument: 'business',
    taxDocument: 'tax',
    companyLogo: 'logos',
    documentFront: 'document-front',
    documentBack: 'document-back',
    selfieWithId: 'selfie-with-id',
    selfie: 'selfie'
};

/** Job seeker identity flow (POST /api/kyc/identity/submit). */
export const IDENTITY_KYC_FIELD_FOLDER = {
    frontDoc: 'identity/id-front',
    backDoc: 'identity/id-back',
    selfie: 'identity/selfie'
};

function resourceTypeForMime(mimetype) {
    return IMAGE_MIMES.has(mimetype) ? 'image' : 'raw';
}

/**
 * Upload a single buffer via data URI (same pattern as testimonialRoutes).
 * @returns {Promise<string>} secure_url
 */
export async function uploadKycBuffer(buffer, mimetype, folderSuffix) {
    const b64 = buffer.toString('base64');
    const dataUri = `data:${mimetype};base64,${b64}`;
    const folder = `${KYC_DOCUMENT_ROOT}/${folderSuffix}`;
    const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: resourceTypeForMime(mimetype)
    });
    return result.secure_url;
}
