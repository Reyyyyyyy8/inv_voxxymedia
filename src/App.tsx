import React, { useState } from 'react';
import { Asset, HandoverRecord, ActivityLog, SystemConfig } from './types';
import { INITIAL_ASSETS, INITIAL_HANDOVERS, INITIAL_LOGS } from './mockData';
import { AssetScanner } from './components/AssetScanner';
import { AssetDetail } from './components/AssetDetail';
import { AssetForm } from './components/AssetForm';
import { HandoverForm } from './components/HandoverForm';
import { BastPdfPreview } from './components/BastPdfPreview';
import { QrBatchGenerator } from './components/QrBatchGenerator';
import { SheetsViewer } from './components/SheetsViewer';
import { TutorialGuide } from './components/TutorialGuide';
import { PinModal } from './components/PinModal';
import { DeleteModal } from './components/DeleteModal';
import { FullInventoryView } from './components/FullInventoryView';
import { generateNextAssetCode } from './utils/qrGenerator';
import { 
  Laptop, 
  QrCode, 
  FileText, 
  Table, 
  Lock, 
  Unlock, 
  BookOpen, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Boxes,
  Scan,
  Database
} from 'lucide-react';

export default function App() {
  // Navigation Tabs: 'scan' | 'inventory' | 'stickers' | 'sheets' | 'guide'
  const [activeMainTab, setActiveMainTab] = useState<'scan' | 'inventory' | 'stickers' | 'sheets' | 'guide'>('scan');
  
  // App Sub-screens: scanner | inventory | detail | register | edit | handover | bast
  const [appScreen, setAppScreen] = useState<'scanner' | 'detail' | 'register' | 'edit' | 'handover' | 'bast'>('scanner');

  // Database State
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [handovers, setHandovers] = useState<HandoverRecord[]>(INITIAL_HANDOVERS);
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [config, setConfig] = useState<SystemConfig>({
    companyName: 'Voxxy Media Indonesia',
    prefix: 'VMI',
    adminPin: '260488',
    adminEmails: ['reyhanfajri88@gmail.com', 'eka@voxxymedia.com', 'rayhan@voxxymedia.com'],
    googleSheetsUrl: '',
    logoUrl: ''
  });

  // Load persistent data from backend API on mount
  React.useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          if (json.data.config) {
            setConfig(json.data.config);
          }
          if (json.data.assets && json.data.assets.length > 0) {
            setAssets(json.data.assets);
          }
          if (json.data.handovers && json.data.handovers.length > 0) {
            setHandovers(json.data.handovers);
          }
          if (json.data.logs && json.data.logs.length > 0) {
            setLogs(json.data.logs);
          }
        }
      })
      .catch(err => {
        console.warn('Using local fallback state:', err);
      });
  }, []);

  const handleUpdateConfig = async (newConfig: SystemConfig) => {
    setConfig(newConfig);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig, pin: newConfig.adminPin })
      });
      showToast('Pengaturan sistem berhasil disimpan!');
    } catch (err) {
      console.warn('Gagal simpan config:', err);
    }
  };

  // Active Selection State
  const [selectedAssetCode, setSelectedAssetCode] = useState<string>('001-VMI-LPT');
  const [pendingNewCode, setPendingNewCode] = useState<string>('');
  const [activeBastHandover, setActiveBastHandover] = useState<HandoverRecord | null>(INITIAL_HANDOVERS[0]);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Security & PIN State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isPinAuthenticated, setIsPinAuthenticated] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Guard action with PIN
  const executeWithPinGuard = (action: () => void) => {
    if (isPinAuthenticated) {
      action();
    } else {
      setPendingAction(() => action);
      setIsPinModalOpen(true);
    }
  };

  const handlePinSuccess = () => {
    setIsPinAuthenticated(true);
    setIsPinModalOpen(false);
    showToast('PIN Terverifikasi! Akses Admin Aktif.');
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Alur Scan QR Code
  const handleScanCode = (scannedCode: string) => {
    const formattedCode = scannedCode.trim().toUpperCase();
    const existing = assets.find(a => a.kode_aset.toUpperCase() === formattedCode);

    if (existing) {
      setSelectedAssetCode(existing.kode_aset);
      setAppScreen('detail');
      showToast(`Aset Ditemukan: ${existing.merk} ${existing.tipe_model}`);
    } else {
      setPendingNewCode(formattedCode);
      executeWithPinGuard(() => {
        setAppScreen('register');
        showToast(`Unit ${formattedCode} belum terdaftar.`);
      });
    }
  };

  // Buka Form Tambah Manual dari Full Inventory
  const handleAddNewManual = () => {
    executeWithPinGuard(() => {
      const existingCodes = assets.map(a => a.kode_aset);
      const nextCode = generateNextAssetCode(existingCodes, config.prefix || 'VMI', 'LPT');
      setPendingNewCode(nextCode);
      setAppScreen('register');
    });
  };

  // Simpan Pendaftaran Baru atau Edit
  const handleSaveAsset = async (assetData: Asset) => {
    const existingIndex = assets.findIndex(a => a.kode_aset === assetData.kode_aset);

    if (existingIndex >= 0) {
      const updated = [...assets];
      updated[existingIndex] = assetData;
      setAssets(updated);
      showToast(`Data aset ${assetData.kode_aset} berhasil diperbarui!`);
    } else {
      setAssets([assetData, ...assets]);
      showToast(`Unit ${assetData.kode_aset} resmi terdaftar!`);
    }

    try {
      await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: assetData,
          pin: config.adminPin,
          operatorEmail: 'reyhanfajri88@gmail.com'
        })
      });
      fetch('/api/data').then(r => r.json()).then(j => {
        if (j.data?.logs) setLogs(j.data.logs);
      });
    } catch (e) {
      console.warn('Backend sync error:', e);
    }

    setSelectedAssetCode(assetData.kode_aset);
    setAppScreen('detail');
  };

  // Simpan Serah Terima (Handover)
  const handleCompleteHandover = async (handoverRecord: HandoverRecord) => {
    setHandovers([handoverRecord, ...handovers]);

    const updatedAssets = assets.map(a => {
      if (a.kode_aset === handoverRecord.kode_aset) {
        return {
          ...a,
          status: 'Dipakai' as const,
          user_saat_ini: handoverRecord.nama_penerima,
          departemen_user: handoverRecord.departemen,
          updated_at: handoverRecord.tgl_handover
        };
      }
      return a;
    });
    setAssets(updatedAssets);

    try {
      await fetch('/api/handovers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handover: handoverRecord,
          pin: config.adminPin,
          operatorEmail: 'reyhanfajri88@gmail.com'
        })
      });
      fetch('/api/data').then(r => r.json()).then(j => {
        if (j.data?.logs) setLogs(j.data.logs);
      });
    } catch (e) {
      console.warn('Backend handover sync error:', e);
    }

    setActiveBastHandover(handoverRecord);
    setAppScreen('bast');
    showToast('Handover Selesai! Berita Acara PDF diterbitkan.');
  };

  // Pengembalian Unit (Return)
  const handleReturnAsset = async () => {
    executeWithPinGuard(async () => {
      const target = assets.find(a => a.kode_aset === selectedAssetCode);
      if (!target) return;

      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const updatedAssets = assets.map(a => {
        if (a.kode_aset === selectedAssetCode) {
          return {
            ...a,
            status: 'Tersedia' as const,
            user_saat_ini: '',
            departemen_user: '',
            updated_at: now
          };
        }
        return a;
      });
      setAssets(updatedAssets);

      try {
        await fetch(`/api/assets/${selectedAssetCode}/return`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pin: config.adminPin,
            operatorEmail: 'reyhanfajri88@gmail.com'
          })
        });
        fetch('/api/data').then(r => r.json()).then(j => {
          if (j.data?.logs) setLogs(j.data.logs);
        });
      } catch (e) {
        console.warn('Backend return sync error:', e);
      }

      showToast(`Unit ${target.kode_aset} dikembalikan ke status Tersedia!`);
    });
  };

  // Hapus Aset (Delete)
  const handleRequestDeleteAsset = (code: string) => {
    const target = assets.find(a => a.kode_aset.toUpperCase() === code.toUpperCase());
    if (!target) return;
    executeWithPinGuard(() => {
      setAssetToDelete(target);
    });
  };

  const handleConfirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    const code = assetToDelete.kode_aset;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Optimistic / Local update
    setAssets(prev => prev.filter(a => a.kode_aset !== code));
    const newLog: ActivityLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: now,
      user_admin: 'reyhanfajri88@gmail.com',
      aksi: 'HAPUS_ASET',
      kode_aset: code,
      deskripsi: `Penghapusan unit ${assetToDelete.merk} ${assetToDelete.tipe_model} (SN: ${assetToDelete.nomor_seri}) dari database.`
    };
    setLogs(prev => [newLog, ...prev]);

    try {
      await fetch(`/api/assets/${code}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: config.adminPin,
          operatorEmail: 'reyhanfajri88@gmail.com'
        })
      });
      fetch('/api/data').then(r => r.json()).then(j => {
        if (j.data?.logs) setLogs(j.data.logs);
      });
    } catch (e) {
      console.warn('Backend delete error:', e);
    }

    showToast(`Unit ${code} (${assetToDelete.merk} ${assetToDelete.tipe_model}) berhasil dihapus!`);
    setAssetToDelete(null);

    // Jika sedang di halaman detail/edit unit ini, arahkan ke daftar inventaris
    if (selectedAssetCode === code) {
      setActiveMainTab('inventory');
      setAppScreen('scanner');
    }
  };

  // Edit Aset
  const handleRequestEditAsset = (assetOrCode: Asset | string) => {
    const code = typeof assetOrCode === 'string' ? assetOrCode : assetOrCode.kode_aset;
    setSelectedAssetCode(code);
    executeWithPinGuard(() => {
      setAppScreen('edit');
    });
  };

  const currentSelectedAsset = assets.find(a => a.kode_aset === selectedAssetCode);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-orange-500 selection:text-white pb-24 md:pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 md:top-20 right-4 left-4 md:left-auto md:w-auto z-50 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl shadow-orange-950/40 flex items-center gap-2 border border-orange-400 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PIN Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        configuredPin={config.adminPin}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!assetToDelete}
        assetCode={assetToDelete?.kode_aset || null}
        assetName={assetToDelete ? `${assetToDelete.merk} ${assetToDelete.tipe_model}` : ''}
        onClose={() => setAssetToDelete(null)}
        onConfirm={handleConfirmDeleteAsset}
      />

      {/* Main App Bar (Clean Mobile Optimized) */}
      <header className="border-b border-orange-500/20 bg-slate-900/95 backdrop-blur sticky top-0 z-40 print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="h-9 max-w-[120px] object-contain rounded-lg" />
            ) : (
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-blue-600 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white font-black text-sm tracking-tighter">
                VMI
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-white text-sm md:text-base leading-tight">
                  Voxxy Media
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                  Inventory
                </span>
              </div>
              <p className="text-[10px] md:text-[11px] text-slate-400">
                Asset & Handover System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isPinAuthenticated) {
                  setIsPinAuthenticated(false);
                  showToast('Sesi Admin dikunci.');
                } else {
                  setIsPinModalOpen(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                isPinAuthenticated
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-orange-500/50'
              }`}
            >
              {isPinAuthenticated ? (
                <>
                  <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Admin Aktif</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Kunci PIN</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Tabs (Hidden on small mobile screens to prevent clutter) */}
        <div className="max-w-6xl mx-auto px-4 hidden md:flex gap-1.5 border-t border-slate-800/80 overflow-x-auto text-xs py-1.5">
          <button
            onClick={() => {
              setActiveMainTab('scan');
              setAppScreen('scanner');
            }}
            className={`px-4 py-2 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeMainTab === 'scan' && appScreen === 'scanner'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Scan className="h-3.5 w-3.5" />
            1. Scan QR Kamera
          </button>

          <button
            onClick={() => {
              setActiveMainTab('inventory');
              setAppScreen('scanner'); // return to main view container
            }}
            className={`px-4 py-2 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeMainTab === 'inventory'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            2. Katalog Inventaris ({assets.length})
          </button>

          <button
            onClick={() => setActiveMainTab('stickers')}
            className={`px-4 py-2 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeMainTab === 'stickers'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            3. Cetak Label QR (A4)
          </button>

          <button
            onClick={() => setActiveMainTab('sheets')}
            className={`px-4 py-2 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeMainTab === 'sheets'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            4. Database & Pengaturan
          </button>

          <button
            onClick={() => setActiveMainTab('guide')}
            className={`px-4 py-2 font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeMainTab === 'guide'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Panduan Google Sheets
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 md:py-6">
        {/* TAB 1: Scan QR Code View */}
        {activeMainTab === 'scan' && (
          <div className="space-y-6">
            {appScreen === 'scanner' && (
              <AssetScanner
                assets={assets}
                onScanCode={handleScanCode}
                onRegisterNew={code => {
                  setPendingNewCode(code);
                  executeWithPinGuard(() => setAppScreen('register'));
                }}
              />
            )}

            {appScreen === 'detail' && currentSelectedAsset && (
              <AssetDetail
                asset={currentSelectedAsset}
                handovers={handovers}
                isAdmin={isPinAuthenticated}
                onRequestAdminLogin={() => setIsPinModalOpen(true)}
                onStartHandover={() => {
                  executeWithPinGuard(() => setAppScreen('handover'));
                }}
                onReturnAsset={handleReturnAsset}
                onEditAsset={() => handleRequestEditAsset(currentSelectedAsset)}
                onDeleteAsset={handleRequestDeleteAsset}
                onViewBast={record => {
                  setActiveBastHandover(record);
                  setAppScreen('bast');
                }}
              />
            )}

            {appScreen === 'register' && (
              <AssetForm
                initialCode={pendingNewCode || `00${assets.length + 1}-VMI-LPT`}
                onBack={() => setAppScreen('scanner')}
                onSave={handleSaveAsset}
              />
            )}

            {appScreen === 'edit' && currentSelectedAsset && (
              <AssetForm
                existingAsset={currentSelectedAsset}
                onBack={() => setAppScreen('detail')}
                onSave={handleSaveAsset}
                onDelete={handleRequestDeleteAsset}
              />
            )}

            {appScreen === 'handover' && currentSelectedAsset && (
              <HandoverForm
                asset={currentSelectedAsset}
                logoUrl={config.logoUrl}
                onBack={() => setAppScreen('detail')}
                onSubmit={handleCompleteHandover}
              />
            )}

            {appScreen === 'bast' && activeBastHandover && (
              <BastPdfPreview
                handover={activeBastHandover}
                asset={assets.find(a => a.kode_aset === activeBastHandover.kode_aset)}
                logoUrl={config.logoUrl}
                onBack={() => setAppScreen('detail')}
              />
            )}
          </div>
        )}

        {/* TAB 2: Full Inventory Browser Catalog */}
        {activeMainTab === 'inventory' && (
          <div className="space-y-6">
            {appScreen === 'detail' && currentSelectedAsset ? (
              <AssetDetail
                asset={currentSelectedAsset}
                handovers={handovers}
                isAdmin={isPinAuthenticated}
                onRequestAdminLogin={() => setIsPinModalOpen(true)}
                onStartHandover={() => {
                  executeWithPinGuard(() => setAppScreen('handover'));
                }}
                onReturnAsset={handleReturnAsset}
                onEditAsset={() => handleRequestEditAsset(currentSelectedAsset)}
                onDeleteAsset={handleRequestDeleteAsset}
                onViewBast={record => {
                  setActiveBastHandover(record);
                  setAppScreen('bast');
                }}
              />
            ) : appScreen === 'register' ? (
              <AssetForm
                initialCode={pendingNewCode || `00${assets.length + 1}-VMI-LPT`}
                onBack={() => setAppScreen('scanner')}
                onSave={handleSaveAsset}
              />
            ) : appScreen === 'edit' && currentSelectedAsset ? (
              <AssetForm
                existingAsset={currentSelectedAsset}
                onBack={() => setAppScreen('detail')}
                onSave={handleSaveAsset}
                onDelete={handleRequestDeleteAsset}
              />
            ) : appScreen === 'handover' && currentSelectedAsset ? (
              <HandoverForm
                asset={currentSelectedAsset}
                logoUrl={config.logoUrl}
                onBack={() => setAppScreen('detail')}
                onSubmit={handleCompleteHandover}
              />
            ) : appScreen === 'bast' && activeBastHandover ? (
              <BastPdfPreview
                handover={activeBastHandover}
                asset={assets.find(a => a.kode_aset === activeBastHandover.kode_aset)}
                logoUrl={config.logoUrl}
                onBack={() => setAppScreen('detail')}
              />
            ) : (
              <FullInventoryView
                assets={assets}
                onSelectAsset={(code) => {
                  setSelectedAssetCode(code);
                  setAppScreen('detail');
                }}
                onAddNewManual={handleAddNewManual}
                onEditAsset={handleRequestEditAsset}
                onDeleteAsset={handleRequestDeleteAsset}
              />
            )}
          </div>
        )}

        {/* TAB 3: Batch Sticker Generator */}
        {activeMainTab === 'stickers' && (
          <QrBatchGenerator logoUrl={config.logoUrl} />
        )}

        {/* TAB 4: Google Sheets Live Sync Viewer */}
        {activeMainTab === 'sheets' && (
          <SheetsViewer
            assets={assets}
            handovers={handovers}
            logs={logs}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onEditAsset={handleRequestEditAsset}
            onDeleteAsset={handleRequestDeleteAsset}
          />
        )}

        {/* TAB 5: Guide */}
        {activeMainTab === 'guide' && <TutorialGuide />}
      </main>

      {/* ================= STICKY MOBILE BOTTOM NAVIGATION BAR ================= */}
      {/* Thumb-friendly mobile navigation for phones */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-orange-500/20 z-40 md:hidden print:hidden px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-4 gap-1 text-center">
          <button
            onClick={() => {
              setActiveMainTab('scan');
              setAppScreen('scanner');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition ${
              activeMainTab === 'scan'
                ? 'text-orange-400 font-bold bg-orange-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scan className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Scan QR</span>
          </button>

          <button
            onClick={() => {
              setActiveMainTab('inventory');
              setAppScreen('scanner');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition ${
              activeMainTab === 'inventory'
                ? 'text-orange-400 font-bold bg-orange-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Katalog ({assets.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveMainTab('stickers');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition ${
              activeMainTab === 'stickers'
                ? 'text-orange-400 font-bold bg-orange-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Label QR</span>
          </button>

          <button
            onClick={() => {
              setActiveMainTab('sheets');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition ${
              activeMainTab === 'sheets'
                ? 'text-orange-400 font-bold bg-orange-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Database</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
