"use strict";
const crypto = require("crypto");

function RndNum(a, b) {
    return Math.ceil((a + (b - a)) * Math.random());
}

function makeRandomIv() {
    const str = '0123456789abcdefghijklmnopqrstuvwxyz';
    const result = [];
    for (let i = 0; i < 16; i++) {
        const r = Math.floor(Math.random() * str.length);
        result.push(str.charAt(r));
    }
    return result.join('');
}

function getAlgorithm(key) {
    const buf = Buffer.from(key);
    switch (buf.length) {
        case 16: return 'aes-128-cbc';
        case 24: return 'aes-192-cbc';
        case 32: return 'aes-256-cbc';
        default: throw new Error('Invalid key length: ' + buf.length);
    }
}

function aesEncrypt(plainText, key, iv) {
    const cipher = crypto.createCipheriv(getAlgorithm(key), key, iv);
    cipher.setAutoPadding(true);
    const encrypted = cipher.update(plainText);
    const final = cipher.final();
    const out = Buffer.concat([encrypted, final]);
    return new Uint8Array(out);
}

function generateToken04(appId, userId, secret, effectiveTimeInSeconds, payload) {
    if (!appId || typeof appId !== 'number') {
        throw { errorCode: 1, errorMessage: 'appID invalid' };
    }
    if (!userId || typeof userId !== 'string') {
        throw { errorCode: 3, errorMessage: 'userId invalid' };
    }
    if (!secret || typeof secret !== 'string' || secret.length !== 32) {
        throw { errorCode: 5, errorMessage: 'secret must be a 32 byte string' };
    }
    if (!effectiveTimeInSeconds || typeof effectiveTimeInSeconds !== 'number') {
        throw { errorCode: 6, errorMessage: 'effectiveTimeInSeconds invalid' };
    }

    const createTime = Math.floor(Date.now() / 1000);
    const tokenInfo = {
        app_id: appId,
        user_id: userId,
        nonce: RndNum(-2147483648, 2147483647),
        ctime: createTime,
        expire: createTime + effectiveTimeInSeconds,
        payload: payload || ''
    };

    const plainText = JSON.stringify(tokenInfo);
    const iv = makeRandomIv();
    const encryptBuf = aesEncrypt(plainText, secret, iv);

    const b1 = Buffer.alloc(8);
    const b2 = Buffer.alloc(2);
    const b3 = Buffer.alloc(2);
    b1.writeBigInt64BE(BigInt(tokenInfo.expire), 0);
    b2.writeUInt16BE(iv.length, 0);
    b3.writeUInt16BE(encryptBuf.byteLength, 0);

    const buf = Buffer.concat([
        b1, b2, Buffer.from(iv), b3, Buffer.from(encryptBuf)
    ]);

    return '04' + buf.toString('base64');
}

module.exports = { generateToken04 };
