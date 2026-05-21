const { net, app } = require('electron');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');
const { machineIdSync } = require('node-machine-id');

// ── Config ────────────────────────────────────────────────────────────────────
// Configurar en LemonSqueezy: Settings → Stores → tu tienda
// El product_id lo encuentras en la URL del producto en tu dashboard
const LEMONSQUEEZY_STORE_ID   = 'PENDING';   // rellenar tras crear producto en LemonSqueezy
const LEMONSQUEEZY_PRODUCT_ID = 'PENDING';   // rellenar tras crear producto en LemonSqueezy

const GRACE_DAYS   = 3;
const RECHECK_DAYS = 7;

// ── Storage path ──────────────────────────────────────────────────────────────
function getLicensePath() {
    return path.join(app.getPath('userData'), 'license.dat');
}

// ── Encryption ────────────────────────────────────────────────────────────────
function getEncKey() {
    const mid = machineIdSync({ original: true });
    return crypto.createHash('sha256').update(mid + 'petalo-salt-v1').digest();
}

function encrypt(text) {
    const iv     = crypto.randomBytes(16);
    const key    = getEncKey();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const enc    = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + enc.toString('hex');
}

function decrypt(data) {
    try {
        const [ivHex, encHex] = data.split(':');
        const iv       = Buffer.from(ivHex, 'hex');
        const key      = getEncKey();
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const dec      = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
        return dec.toString('utf8');
    } catch { return null; }
}

// ── Persistence ───────────────────────────────────────────────────────────────
function saveLicense(data) {
    fs.writeFileSync(getLicensePath(), encrypt(JSON.stringify(data)), 'utf8');
}

function loadLicense() {
    try {
        const raw = fs.readFileSync(getLicensePath(), 'utf8');
        const dec = decrypt(raw);
        if (!dec) return null;
        return JSON.parse(dec);
    } catch { return null; }
}

function clearLicense() {
    try { fs.unlinkSync(getLicensePath()); } catch {}
}

// ── LemonSqueezy API ──────────────────────────────────────────────────────────
function verifyWithLemonSqueezy(licenseKey) {
    return new Promise((resolve, reject) => {
        const body = `license_key=${encodeURIComponent(licenseKey)}&instance_name=${encodeURIComponent('petalo-desktop')}`;
        const req  = net.request({
            method: 'POST',
            url: 'https://api.lemonsqueezy.com/v1/licenses/validate',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
        });
        let data = '';
        req.on('response', (res) => {
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { reject(new Error('Respuesta inválida del servidor de licencias')); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ── Public API ────────────────────────────────────────────────────────────────
async function activate(licenseKey) {
    let res;
    try {
        res = await verifyWithLemonSqueezy(licenseKey.trim());
    } catch {
        return { ok: false, error: 'Sin conexión. Comprueba tu internet e inténtalo de nuevo.' };
    }

    if (!res.valid) {
        return { ok: false, error: 'Clave de licencia inválida o ya utilizada.' };
    }

    if (LEMONSQUEEZY_PRODUCT_ID !== 'PENDING' && res.meta?.product_id?.toString() !== LEMONSQUEEZY_PRODUCT_ID) {
        return { ok: false, error: 'Esta clave no es válida para este producto.' };
    }

    const expiresAt = res.license_key?.expires_at
        ? new Date(res.license_key.expires_at).getTime()
        : null;
    const email = res.meta?.customer_email || '';

    if (expiresAt && Date.now() > expiresAt) {
        return { ok: false, error: 'Esta licencia ha expirado. Por favor, renuévala.' };
    }

    saveLicense({ key: licenseKey.trim(), email, expiresAt, activatedAt: Date.now(), lastCheck: Date.now() });
    return { ok: true, email, expiresAt };
}

async function check() {
    const lic = loadLicense();
    if (!lic) return { valid: false, reason: 'no_license' };

    if (lic.expiresAt && Date.now() > lic.expiresAt) {
        clearLicense();
        return { valid: false, reason: 'expired' };
    }

    const now       = Date.now();
    const daysSince = (now - (lic.lastCheck || 0)) / 86400000;
    const daysLeft  = lic.expiresAt ? Math.ceil((lic.expiresAt - now) / 86400000) : Infinity;

    if (daysSince < RECHECK_DAYS) {
        return { valid: true, email: lic.email, expiresAt: lic.expiresAt, daysLeft };
    }

    try {
        const res = await verifyWithLemonSqueezy(lic.key);
        if (!res.valid) { clearLicense(); return { valid: false, reason: 'revoked' }; }

        const expiresAt = res.license_key?.expires_at
            ? new Date(res.license_key.expires_at).getTime()
            : lic.expiresAt;

        if (expiresAt && Date.now() > expiresAt) { clearLicense(); return { valid: false, reason: 'expired' }; }

        saveLicense({ ...lic, expiresAt, lastCheck: now });
        const updatedDaysLeft = expiresAt ? Math.ceil((expiresAt - now) / 86400000) : Infinity;
        return { valid: true, email: res.meta?.customer_email || lic.email, expiresAt, daysLeft: updatedDaysLeft };

    } catch {
        const daysSinceCheck = (now - lic.lastCheck) / 86400000;
        if (daysSinceCheck > GRACE_DAYS) return { valid: false, reason: 'no_internet' };
        return { valid: true, email: lic.email, expiresAt: lic.expiresAt, daysLeft, offline: true };
    }
}

function deactivate() { clearLicense(); }

function getCachedLicense() { return loadLicense(); }

module.exports = { activate, check, deactivate, getCachedLicense };
