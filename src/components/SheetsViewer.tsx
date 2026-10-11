import React, { useState, useRef } from 'react';
import { Asset, HandoverRecord, ActivityLog, SystemConfig } from '../types';
import { INITIAL_CATEGORIES } from '../mockData';
import { formatRupiah } from '../utils/qrGenerator';
import { 
  Table, 
  ExternalLink, 
  Download, 
  Plus, 
  Save, 
  KeyRound, 
  Mail, 
  FileSpreadsheet, 
  Link, 
  CheckCircle2, 
  Image as ImageIcon,
  Upload,
  Building
} from 'lucide-react';

interface SheetsViewerProps {
  assets: Asset[];
  handovers: HandoverRecord[];
  logs: ActivityLog[];
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
}

export const SheetsViewer: React.FC<SheetsViewerProps> = ({
  assets,
  handovers,
  logs,
  config,
  onUpdateConfig
}) => {
  const [activeSheetTab, setActiveSheetTab] = useState<'ASET' | 'HANDOVER' | 'LOG' | 'MASTER'>('ASET');
  const [sheetUrlInput, setSheetUrlInput] = useState(config.googleSheetsUrl || '');
  const [pinInput, setPinInput] = useState(config.adminPin || '260488');
  const [emailsInput, setEmailsInput] = useState(config.adminEmails.join(', '));
  const [logoUrlInput, setLogoUrlInput] = useState(config.logoUrl || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Export CSV Helper
  const downloadCsv = (tabName: 'ASET' | 'HANDOVER' | 'LOG') => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (tabName === 'ASET') {
      headers = ['kode_aset', 'kategori', 'merk', 'tipe_model', 'nomor_seri', 'spesifikasi', 'tgl_beli', 'harga', 'vendor', 'kondisi', 'status', 'lokasi', 'user_saat_ini', 'catatan', 'created_at', 'updated_at'];
      rows = assets.map(a => [
        a.kode_aset, a.kategori, a.merk, a.tipe_model, a.nomor_seri, `"${a.spesifikasi.replace(/"/g, '""')}"`, a.tgl_beli, a.harga.toString(), a.vendor, a.kondisi, a.status, a.lokasi, a.user_saat_ini, `"${a.catatan.replace(/"/g, '""')}"`, a.created_at, a.updated_at
      ]);
    } else if (tabName === 'HANDOVER') {
      headers = ['no_surat', 'tgl_handover', 'jenis_transaksi', 'kode_aset', 'nama_penerima', 'email_penerima', 'nik_karyawan', 'departemen', 'jabatan', 'nama_petugas', 'kondisi_fisik', 'kelengkapan', 'catatan_kelengkapan', 'link_pdf', 'created_at'];
      rows = handovers.map(h => [
        h.no_surat, h.tgl_handover, h.jenis_transaksi, h.kode_aset, h.nama_penerima, h.email_penerima, h.nik_karyawan, h.departemen, h.jabatan, h.nama_petugas, `"${h.kondisi_fisik}"`, `"${h.kelengkapan.join(', ')}"`, `"${h.catatan_kelengkapan}"`, h.pdf_drive_link || '', h.created_at
      ]);
    } else {
      headers = ['id_log', 'timestamp', 'user_admin', 'aksi', 'kode_aset', 'deskripsi'];
      rows = logs.map(l => [
        l.id, l.timestamp, l.user_admin, l.aksi, l.kode_aset, `"${l.deskripsi.replace(/"/g, '""')}"`
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VMI_${tabName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoUrlInput(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedEmails = emailsInput
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    const updatedConfig: SystemConfig = {
      ...config,
      adminPin: pinInput.trim() || '260488',
      adminEmails: parsedEmails,
      googleSheetsUrl: sheetUrlInput.trim(),
      logoUrl: logoUrlInput.trim()
    };

    onUpdateConfig(updatedConfig);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Google Sheet Direct Link & Quick Actions Bar */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/25 to-slate-900 border border-orange-500/30 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Database Inventaris Kantor</h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/25 font-mono">
                  Voxxy Media Indonesia
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pencatatan data aset, riwayat serah terima, dan log aktivitas operasional.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {config.googleSheetsUrl ? (
              <a
                href={config.googleSheetsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="h-4 w-4" /> Buka Google Sheets
              </a>
            ) : (
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 flex items-center gap-1.5 transition"
              >
                <Plus className="h-4 w-4" /> Buka Sheet Baru
              </a>
            )}

            <button
              onClick={() => downloadCsv(activeSheetTab === 'MASTER' ? 'ASET' : activeSheetTab)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Download className="h-4 w-4" /> Unduh CSV
            </button>
          </div>
        </div>

        {/* Input Tautan Google Sheet */}
        <form onSubmit={handleSaveSettings} className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2 items-center text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Link className="h-3.5 w-3.5 text-orange-400" /> Tautan Google Sheets:
          </span>
          <input
            type="url"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetUrlInput}
            onChange={e => setSheetUrlInput(e.target.value)}
            className="flex-1 min-w-[280px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition"
          >
            <Save className="h-3.5 w-3.5" /> Simpan Tautan
          </button>
          {saveSuccessMsg && (
            <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Tersimpan!
            </span>
          )}
        </form>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSheetTab('ASET')}
          className={`px-4 py-2 rounded-xl font-bold transition ${
            activeSheetTab === 'ASET' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Tab 1: ASET ({assets.length} Laptop)
        </button>
        <button
          onClick={() => setActiveSheetTab('HANDOVER')}
          className={`px-4 py-2 rounded-xl font-bold transition ${
            activeSheetTab === 'HANDOVER' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Tab 2: HANDOVER ({handovers.length} Surat)
        </button>
        <button
          onClick={() => setActiveSheetTab('LOG')}
          className={`px-4 py-2 rounded-xl font-bold transition ${
            activeSheetTab === 'LOG' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Tab 3: LOG_AKTIVITAS ({logs.length} Entri)
        </button>
        <button
          onClick={() => setActiveSheetTab('MASTER')}
          className={`px-4 py-2 rounded-xl font-bold transition ${
            activeSheetTab === 'MASTER' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Tab 4: MASTER & LOGO / PENGATURAN
        </button>
      </div>

      {/* Sheet Content Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {activeSheetTab === 'ASET' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Kode Aset</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Merk & Tipe</th>
                  <th className="p-3.5">Serial Number</th>
                  <th className="p-3.5">Spesifikasi</th>
                  <th className="p-3.5">Harga Beli</th>
                  <th className="p-3.5">Kondisi</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Pemegang</th>
                  <th className="p-3.5">Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {assets.map(item => (
                  <tr key={item.kode_aset} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-orange-400">{item.kode_aset}</td>
                    <td className="p-3.5">{item.kategori}</td>
                    <td className="p-3.5 font-bold text-white">{item.merk} {item.tipe_model}</td>
                    <td className="p-3.5 font-mono text-slate-400">{item.nomor_seri}</td>
                    <td className="p-3.5 max-w-xs truncate text-slate-300" title={item.spesifikasi}>{item.spesifikasi}</td>
                    <td className="p-3.5 font-mono text-orange-400 font-semibold">{formatRupiah(item.harga)}</td>
                    <td className="p-3.5">{item.kondisi}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.status === 'Tersedia'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5">{item.user_saat_ini || <span className="text-slate-500">-</span>}</td>
                    <td className="p-3.5 text-slate-400">{item.lokasi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSheetTab === 'HANDOVER' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">No. BAST</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Kode Aset</th>
                  <th className="p-3.5">Nama Penerima</th>
                  <th className="p-3.5">Departemen</th>
                  <th className="p-3.5">Jabatan</th>
                  <th className="p-3.5">Petugas IT</th>
                  <th className="p-3.5">Kelengkapan</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {handovers.map(ho => (
                  <tr key={ho.id_handover} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-white">{ho.no_surat}</td>
                    <td className="p-3.5 text-slate-400">{ho.tgl_handover}</td>
                    <td className="p-3.5 font-mono text-orange-400 font-bold">{ho.kode_aset}</td>
                    <td className="p-3.5 font-bold text-white">{ho.nama_penerima}</td>
                    <td className="p-3.5">{ho.departemen}</td>
                    <td className="p-3.5 text-slate-300">{ho.jabatan}</td>
                    <td className="p-3.5 text-slate-400">{ho.nama_petugas}</td>
                    <td className="p-3.5 max-w-xs truncate text-slate-400" title={ho.kelengkapan.join(', ')}>
                      {ho.kelengkapan.join(', ')}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-800">
                        Dokumen Sah
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSheetTab === 'LOG' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Operator</th>
                  <th className="p-3.5">Aksi</th>
                  <th className="p-3.5">Kode Aset</th>
                  <th className="p-3.5">Rincian Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono text-slate-400">{log.timestamp}</td>
                    <td className="p-3.5 text-orange-300 font-medium">{log.user_admin}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                        {log.aksi}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-orange-400 font-bold">{log.kode_aset}</td>
                    <td className="p-3.5 text-slate-300">{log.deskripsi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSheetTab === 'MASTER' && (
          <div className="p-6 space-y-6 text-xs">
            {/* Bagian Upload / Tautkan Logo Perusahaan */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-orange-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="h-5 w-5 text-orange-400" />
                  <div>
                    <h4 className="font-bold text-white text-sm">Logo Resmi Perusahaan (Voxxy Media Indonesia)</h4>
                    <p className="text-[11px] text-slate-400">
                      Logo ini akan muncul di Header aplikasi, Kop Surat PDF Berita Acara (BAST), dan Stiker Label QR.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5 items-center">
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Upload File Logo dari Komputer/HP:</label>
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition"
                    >
                      <Upload className="h-4 w-4 text-orange-400" /> Pilih File Gambar Logo (PNG / JPG / SVG)
                    </button>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Atau Masukkan URL Logo Gambar:</label>
                    <input
                      type="text"
                      placeholder="https://voxxymedia.com/assets/logo.png atau /logo.png"
                      value={logoUrlInput}
                      onChange={e => setLogoUrlInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Pratinjau Logo */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center min-h-[120px]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                    Pratinjau Logo Saat Ini
                  </span>
                  {logoUrlInput ? (
                    <div className="p-2 bg-white rounded-xl max-h-20 flex items-center justify-center">
                      <img src={logoUrlInput} alt="Preview Logo" className="max-h-16 max-w-[200px] object-contain" />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/25">
                      VMI
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Pengaturan PIN & Email Admin */}
            <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-orange-400" />
                  <h4 className="font-bold text-white text-sm">Otorisasi PIN & Whitelist Email Admin</h4>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-orange-400" /> PIN Akses Cepat (6 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:border-orange-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-400">
                    PIN otorisasi serah terima laptop atau perubahan data di HP.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-orange-400" /> Email Admin Pengelola (Pisahkan koma)
                  </label>
                  <input
                    type="text"
                    value={emailsInput}
                    onChange={e => setEmailsInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Akun yang memiliki wewenang administrator.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition"
                >
                  <Save className="h-4 w-4" /> Simpan Pengaturan
                </button>
              </div>
            </form>

            {/* Tabel Kategori */}
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Kategori Aset Operasional</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {INITIAL_CATEGORIES.map(cat => (
                  <div key={cat.kode} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-orange-400">{cat.kode}</span>
                        <span className="font-bold text-white">{cat.nama}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{cat.deskripsi}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
