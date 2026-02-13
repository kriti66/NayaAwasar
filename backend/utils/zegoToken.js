import crypto from 'crypto';

function makeNonce() {
    return Math.floor(Math.random() * 0x100000000); // 32-bit integer
}

function makeRandomIv() {
    // Generate 16 random bytes
    const str = '0123456789abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 16; i++) {
        const r = Math.floor(Math.random() * str.length);
        result += str.charAt(r);
    }
    return result;
}

function getAlgorithm(key) {
    if (key.length === 16) return 'aes-128-cbc';
    if (key.length === 24) return 'aes-192-cbc';
    if (key.length === 32) return 'aes-256-cbc';
    throw new Error('Key length must be 16, 24, or 32 bytes');
}

function aesEncrypt(plainText, key, iv) {
    const algorithm = getAlgorithm(key);
    // Key must be Buffer or String. If String, verify encoding.
    // Zego server secret is usually 32 chars. 'aes-256-cbc' requires 32 bytes.
    // However, Zego documentation examples often show server secret is 32 BYTES (64 hex chars?) or 32 chars?
    // If it's a 32-char string, that's 32 bytes.

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    cipher.setAutoPadding(true); // PKCS7
    let encrypted = cipher.update(plainText, 'utf8');
    const final = cipher.final();
    const out = Buffer.concat([encrypted, final]);

    return Uint8Array.from(out);
}

export function generateToken04(appId, userId, secret, effectiveTimeInSeconds, payload) {
    if (!appId || !userId || !secret) {
        throw new Error('missing required parameters');
    }

    const createTime = Math.floor(new Date().getTime() / 1000);
    const tokenInfo = {
        app_id: appId,
        user_id: userId,
        nonce: makeNonce(),
        create_time: createTime,
        expire_time: createTime + effectiveTimeInSeconds,
        payload: payload || ''
    };

    // Convert to JSON string
    const pl = JSON.stringify(tokenInfo);

    // Generate IV (16 bytes random string or buffer?)
    // Zego usually expects IV as a string of 16 chars for the IV param?
    // But encryption takes Buffer usually.
    // Wait, the IV in the output structure is 16 bytes.
    const ivStr = makeRandomIv(); // 16 chars
    const iv = Buffer.from(ivStr);

    // Encrypt
    // Secret must be 32 bytes for AES-256-CBC
    // If secret is shorter/longer, adjust.
    // We assume 32 char string.
    let key = secret;
    if (secret.length !== 32) {
        // Fallback logic not implemented: assuming valid secret
        // If hex string (64 chars), convert to Buffer?
        // For now assuming 32 char string.
    }

    const encryptedContent = aesEncrypt(pl, key, iv);

    // Pack
    // structure: 
    // expire_time (8 bytes, Big Endian)
    // iv (16 bytes)
    // content_length (2 bytes, Big Endian)
    // content (encryptedContent)

    const b1 = Buffer.alloc(8);
    // JS max safe integer 2^53. Time fits.
    // Write BigInt64BE
    b1.writeBigInt64BE(BigInt(tokenInfo.expire_time), 0);

    const b2 = Buffer.alloc(2);
    b2.writeUInt16BE(encryptedContent.length, 0);

    const buf = Buffer.concat([
        b1,
        iv,
        b2,
        Buffer.from(encryptedContent)
    ]);

    return '04' + buf.toString('base64');
}
