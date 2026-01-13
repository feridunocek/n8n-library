import crypto from 'crypto';

// Use a consistent key from environment variables
// In production, ENCRYPTION_KEY must be exactly 32 chars (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 chars fallback for dev
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex')
    };
}

export function decrypt(text: { iv: string; encryptedData: string }) {
    const iv = Buffer.from(text.iv, 'hex');
    const encryptedText = Buffer.from(text.encryptedData, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
