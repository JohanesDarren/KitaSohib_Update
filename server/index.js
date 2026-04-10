require('dotenv').config();
const express = require('express');
const midtransClient = require('midtrans-client');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// --- CORS (hanya izinkan dari Vite dev server) ---
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// --- Init Midtrans CoreApi ---
const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// --- GAS API URL untuk update database ---
const GAS_API_URL = process.env.GAS_API_URL || '';

/** Helper: update school subscription via Google Apps Script */
async function updateSchoolSubscription(school_id, plan, endDateISO) {
  if (!GAS_API_URL) {
    console.warn('[Webhook] GAS_API_URL tidak dikonfigurasi. Skip update DB.');
    return;
  }
  try {
    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'upgrade_plan',
        payload: { school_id, plan, subscription_end_date: endDateISO }
      })
    });
    const text = await res.text();
    console.log('[Webhook] GAS Response:', text);
  } catch (err) {
    console.error('[Webhook] Gagal update GAS:', err.message);
  }
}

/**
 * POST /api/payments/qris
 * Body: { plan: 'pro' | 'premium', school_id: string, school_name: string }
 * Membuat transaksi QRIS baru di Midtrans dan mengembalikan QR Code URL
 */
app.post('/api/payments/qris', async (req, res) => {
  const { plan, school_id, school_name } = req.body;

  if (!plan || !['pro', 'premium'].includes(plan)) {
    return res.status(400).json({ error: 'Parameter plan tidak valid. Gunakan "pro" atau "premium".' });
  }

  const grossAmount = plan === 'pro' ? 500000 : 1000000;
  const orderId = `KITASOHIB-${plan.toUpperCase()}-${uuidv4()}`;

  const parameter = {
    payment_type: 'qris',
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    qris: {
      acquirer: 'gopay',
    },
    customer_details: {
      first_name: school_name || 'Sekolah',
      email: 'payment@kitasohib.com',
    },
    // Custom metadata untuk dipakai kembali saat webhook
    custom_field1: school_id || '',
    custom_field2: plan,
  };

  try {
    const chargeResponse = await coreApi.charge(parameter);
    console.log('[QRIS Charge] Success:', chargeResponse.order_id);

    // Ambil QR Code URL dari response actions Midtrans
    const actions = chargeResponse.actions || [];
    const qrCodeUrl =
      actions.find(a => a.name === 'generate-qr-code')?.url ||
      chargeResponse.qr_string ||
      null;

    return res.json({
      success: true,
      order_id: chargeResponse.order_id,
      transaction_id: chargeResponse.transaction_id,
      gross_amount: grossAmount,
      qr_code_url: qrCodeUrl,
      qr_string: chargeResponse.qr_string || null,
      expiry_time: chargeResponse.expiry_time,
      plan,
      school_id,
    });
  } catch (err) {
    console.error('[QRIS Charge] Error:', err?.ApiResponse || err.message);
    const detail = err?.ApiResponse?.error_messages?.[0] || err.message;
    return res.status(500).json({ error: 'Gagal membuat transaksi QRIS.', detail });
  }
});

/**
 * GET /api/payments/status/:orderId
 * Cek status transaksi (polling fallback setelah user klik "Saya Sudah Bayar")
 */
app.get('/api/payments/status/:orderId', async (req, res) => {
  try {
    const status = await coreApi.transaction.status(req.params.orderId);
    return res.json(status);
  } catch (err) {
    const detail = err?.ApiResponse || err.message;
    return res.status(500).json({ error: 'Gagal cek status.', detail });
  }
});

/**
 * POST /api/payments/webhook
 * Midtrans akan hit endpoint ini saat status pembayaran berubah.
 *
 * CARA PENGGUNAAN (Production):
 * 1. Deploy server ini ke hosting publik (Vercel, Railway, dll)
 * 2. Daftarkan URL di: Midtrans Dashboard > Settings > Configuration > Payment Notification URL
 *    Contoh: https://your-domain.com/api/payments/webhook
 *
 * Untuk SANDBOX testing lokal, gunakan ngrok:
 *   npx ngrok http 3001
 *   lalu daftarkan URL ngrok di Midtrans Sandbox Dashboard
 */
app.post('/api/payments/webhook', async (req, res) => {
  const notification = req.body;

  console.log('[Webhook] Received:', JSON.stringify(notification, null, 2));

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
    custom_field1: school_id,
    custom_field2: plan,
  } = notification;

  // --- Verifikasi signature key (keamanan) ---
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const expectedSignature = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');

  if (signature_key !== expectedSignature) {
    console.warn('[Webhook] Signature tidak valid!');
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // --- Logika berdasarkan status transaksi ---
  const isSuccess =
    transaction_status === 'settlement' ||
    (transaction_status === 'capture' && fraud_status === 'accept');

  if (isSuccess) {
    console.log(`[Webhook] SUKSES! Order: ${order_id}, School: ${school_id}, Plan: ${plan}`);

    // Hitung tanggal berakhir: +30 hari dari sekarang
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const endDateISO = endDate.toISOString();

    // Update database via Google Apps Script
    await updateSchoolSubscription(school_id, plan, endDateISO);
  } else {
    console.log(`[Webhook] Status: ${transaction_status} | Order: ${order_id}`);
  }

  // Selalu balas 200 ke Midtrans agar tidak dikirim ulang
  return res.status(200).json({ status: 'ok' });
});

/**
 * POST /api/payments/simulate
 * ⚠️  HANYA UNTUK SANDBOX / DEVELOPMENT — Jangan dipakai di production!
 *
 * Cara kerja:
 * 1. Cek status order via Midtrans API
 * 2. Jika masih pending (normal di sandbox), langsung jalankan logika
 *    yang sama dengan webhook berhasil — update subscription via GAS.
 * 3. Return sukses ke frontend agar UI bisa update.
 *
 * Body: { order_id: string, plan: string, school_id: string }
 */
app.post('/api/payments/simulate', async (req, res) => {
  // Blokir endpoint ini di production
  if (process.env.MIDTRANS_IS_PRODUCTION === 'true') {
    return res.status(403).json({ error: 'Endpoint ini hanya tersedia di Sandbox mode.' });
  }

  const { order_id, plan, school_id } = req.body;
  if (!order_id) {
    return res.status(400).json({ error: 'order_id diperlukan.' });
  }

  try {
    // Verifikasi bahwa order_id benar-benar ada di Midtrans
    let txStatus;
    try {
      txStatus = await coreApi.transaction.status(order_id);
      console.log('[Simulate] Status transaksi:', txStatus.transaction_status, '| Order:', order_id);
    } catch (statusErr) {
      const errMsg = statusErr?.ApiResponse?.status_message || statusErr.message;
      console.error('[Simulate] Order tidak ditemukan di Midtrans:', errMsg);
      return res.status(404).json({
        error: `Order "${order_id}" tidak ditemukan di Midtrans. Pastikan QRIS sudah di-generate terlebih dahulu.`,
        detail: errMsg
      });
    }

    // Jika sudah settlement, tidak perlu simulasi
    if (txStatus.transaction_status === 'settlement') {
      return res.json({
        success: true,
        alreadySettled: true,
        message: 'Transaksi sudah settlement. Klik "Saya Sudah Bayar" untuk update langganan.',
      });
    }

    // Jalankan langsung logika update subscription (bypass webhook Midtrans)
    const planToUse = plan || txStatus.custom_field2 || 'pro';
    const schoolIdToUse = school_id || txStatus.custom_field1 || '';

    console.log(`[Simulate] Menjalankan upgrade plan: school=${schoolIdToUse}, plan=${planToUse}`);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const endDateISO = endDate.toISOString();

    await updateSchoolSubscription(schoolIdToUse, planToUse, endDateISO);

    return res.json({
      success: true,
      message: `Simulasi berhasil! Langganan ${planToUse.toUpperCase()} diaktifkan untuk school ${schoolIdToUse}.`,
      subscription_end_date: endDateISO,
      plan: planToUse,
      school_id: schoolIdToUse,
    });

  } catch (err) {
    console.error('[Simulate] Error:', err?.ApiResponse || err.message);
    const detail = err?.ApiResponse?.error_messages?.[0] || err?.ApiResponse?.status_message || err.message;
    return res.status(500).json({ error: 'Gagal simulasi pembayaran.', detail });
  }
});

const PORT = process.env.SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ KitaSohib Payment Server berjalan di http://localhost:${PORT}`);
  console.log(`   Mode       : ${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? '🔴 PRODUCTION' : '🟡 SANDBOX'}`);
  console.log(`   QRIS       : POST http://localhost:${PORT}/api/payments/qris`);
  console.log(`   Status     : GET  http://localhost:${PORT}/api/payments/status/:orderId`);
  console.log(`   Webhook    : POST http://localhost:${PORT}/api/payments/webhook`);
  if (process.env.MIDTRANS_IS_PRODUCTION !== 'true') {
    console.log(`   [DEV] Sim  : POST http://localhost:${PORT}/api/payments/simulate`);
  }
  console.log('');
});
