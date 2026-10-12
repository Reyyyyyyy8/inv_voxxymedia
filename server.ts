import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'inventory.json');

app.use(express.json({ limit: '10mb' }));

// Helper untuk membaca database JSON
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData = {
        config: {
          companyName: 'Voxxy Media Indonesia',
          prefix: 'VMI',
          adminPin: '260488',
          adminEmails: ['reyhanfajri88@gmail.com', 'admin.it@voxxymedia.id'],
          googleSheetsUrl: ''
        },
        assets: [],
        handovers: [],
        logs: []
      };
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { config: {}, assets: [], handovers: [], logs: [] };
  }
}

// Helper untuk menulis database JSON
function writeDb(data: any) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// ================= API ENDPOINTS =================

// 1. GET ALL DATA
app.get('/api/data', (_req, res) => {
  const db = readDb();
  res.json({ success: true, data: db });
});

// 2. GET ASSETS
app.get('/api/assets', (_req, res) => {
  const db = readDb();
  res.json({ success: true, assets: db.assets || [] });
});

// 3. GET ASSET BY CODE
app.get('/api/assets/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const db = readDb();
  const asset = (db.assets || []).find((a: any) => a.kode_aset.toUpperCase() === code);
  if (!asset) {
    return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });
  }
  res.json({ success: true, asset });
});

// 4. POST CREATE / REGISTER ASSET
app.post('/api/assets', (req, res) => {
  const { asset, pin, operatorEmail } = req.body;
  const db = readDb();

  if (pin && pin !== db.config?.adminPin) {
    return res.status(403).json({ success: false, message: 'PIN Admin salah!' });
  }

  const existingIndex = (db.assets || []).findIndex(
    (a: any) => a.kode_aset.toUpperCase() === asset.kode_aset.toUpperCase()
  );

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  if (existingIndex >= 0) {
    // Update
    db.assets[existingIndex] = { ...asset, updated_at: now };
    db.logs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: now,
      user_admin: operatorEmail || 'reyhanfajri88@gmail.com',
      aksi: 'UPDATE_DATA',
      kode_aset: asset.kode_aset,
      deskripsi: `Update data aset ${asset.merk} ${asset.tipe_model}`
    });
  } else {
    // New
    const newAsset = { ...asset, created_at: now, updated_at: now };
    db.assets.unshift(newAsset);
    db.logs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: now,
      user_admin: operatorEmail || 'reyhanfajri88@gmail.com',
      aksi: 'REGISTRASI_BARU',
      kode_aset: asset.kode_aset,
      deskripsi: `Registrasi baru laptop ${asset.merk} ${asset.tipe_model} (SN: ${asset.nomor_seri})`
    });
  }

  writeDb(db);
  res.json({ success: true, message: 'Data berhasil disimpan', asset });
});

// 5. POST HANDOVER
app.post('/api/handovers', (req, res) => {
  const { handover, pin, operatorEmail } = req.body;
  const db = readDb();

  if (pin && pin !== db.config?.adminPin) {
    return res.status(403).json({ success: false, message: 'PIN Admin salah!' });
  }

  // Update Asset status
  const targetAsset = (db.assets || []).find(
    (a: any) => a.kode_aset.toUpperCase() === handover.kode_aset.toUpperCase()
  );

  if (targetAsset) {
    targetAsset.status = 'Dipakai';
    targetAsset.user_saat_ini = handover.nama_penerima;
    targetAsset.departemen_user = handover.departemen;
    targetAsset.updated_at = handover.tgl_handover;
  }

  // Save handover record
  db.handovers.unshift(handover);

  // Log activity
  db.logs.unshift({
    id: `LOG-${Date.now().toString().slice(-4)}`,
    timestamp: handover.created_at,
    user_admin: operatorEmail || 'reyhanfajri88@gmail.com',
    aksi: 'HANDOVER',
    kode_aset: handover.kode_aset,
    deskripsi: `Serah terima ke ${handover.nama_penerima} (${handover.departemen}). Surat: ${handover.no_surat}`
  });

  writeDb(db);
  res.json({ success: true, message: 'Serah terima berhasil dicatat', handover });
});

// 6. POST RETURN ASSET
app.post('/api/assets/:code/return', (req, res) => {
  const code = req.params.code.toUpperCase();
  const { pin, operatorEmail } = req.body;
  const db = readDb();

  if (pin && pin !== db.config?.adminPin) {
    return res.status(403).json({ success: false, message: 'PIN Admin salah!' });
  }

  const targetAsset = (db.assets || []).find((a: any) => a.kode_aset.toUpperCase() === code);
  if (!targetAsset) {
    return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });
  }

  const previousHolder = targetAsset.user_saat_ini;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  targetAsset.status = 'Tersedia';
  targetAsset.user_saat_ini = '';
  targetAsset.departemen_user = '';
  targetAsset.updated_at = now;

  db.logs.unshift({
    id: `LOG-${Date.now().toString().slice(-4)}`,
    timestamp: now,
    user_admin: operatorEmail || 'reyhanfajri88@gmail.com',
    aksi: 'RETURN',
    kode_aset: targetAsset.kode_aset,
    deskripsi: `Pengembalian laptop dari ${previousHolder}. Status kembali Tersedia di gudang.`
  });

  writeDb(db);
  res.json({ success: true, message: 'Unit berhasil dikembalikan ke status Tersedia', asset: targetAsset });
});

// 7. DELETE ASSET
app.delete('/api/assets/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const { pin, operatorEmail } = req.body;
  const db = readDb();

  if (pin && pin !== db.config?.adminPin) {
    return res.status(403).json({ success: false, message: 'PIN Admin salah!' });
  }

  const assetIndex = (db.assets || []).findIndex((a: any) => a.kode_aset.toUpperCase() === code);
  if (assetIndex === -1) {
    return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });
  }

  const deletedAsset = db.assets[assetIndex];
  db.assets.splice(assetIndex, 1);

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.logs.unshift({
    id: `LOG-${Date.now().toString().slice(-4)}`,
    timestamp: now,
    user_admin: operatorEmail || 'reyhanfajri88@gmail.com',
    aksi: 'HAPUS_ASET',
    kode_aset: code,
    deskripsi: `Penghapusan unit ${deletedAsset.merk} ${deletedAsset.tipe_model} (SN: ${deletedAsset.nomor_seri}) dari database.`
  });

  writeDb(db);
  res.json({ success: true, message: `Unit ${code} berhasil dihapus dari database` });
});

// 8. CONFIG & GOOGLE SHEETS SYNC URL
app.post('/api/config', (req, res) => {
  const { config, pin } = req.body;
  const db = readDb();

  if (pin && pin !== db.config?.adminPin) {
    return res.status(403).json({ success: false, message: 'PIN Admin salah!' });
  }

  db.config = { ...db.config, ...config };
  writeDb(db);
  res.json({ success: true, message: 'Pengaturan berhasil diperbarui', config: db.config });
});

// Mount Vite in Dev mode or static files in Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Inventory Backend Server running on http://localhost:${PORT}`);
  });
}

startServer();
