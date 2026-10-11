import React, { useState } from 'react';
import { getQrCodeImageUrl } from '../utils/qrGenerator';
import { Printer, QrCode, Layers, Sliders } from 'lucide-react';

interface QrBatchGeneratorProps {
  logoUrl?: string;
}

export const QrBatchGenerator: React.FC<QrBatchGeneratorProps> = ({ logoUrl }) => {
  const [startSeq, setStartSeq] = useState(1);
  const [count, setCount] = useState(12);
  const [category, setCategory] = useState('LPT');
  const [baseUrl, setBaseUrl] = useState('https://script.google.com/macros/s/AKfycb.../exec');

  const stickers = Array.from({ length: count }, (_, i) => {
    const seqNum = (startSeq + i).toString().padStart(3, '0');
    const assetCode = `${seqNum}-VMI-${category}`;
    const scanUrl = `${baseUrl}?code=${assetCode}`;
    return {
      assetCode,
      scanUrl,
      qrUrl: getQrCodeImageUrl(scanUrl, 160)
    };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Control Panel (Hidden during print) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-orange-500/30 space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Generator Stiker Label QR</h2>
              <p className="text-xs text-slate-400">
                Pencetakan stiker identitas fisik batch untuk unit operasional kantor.
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center gap-2 transition"
          >
            <Printer className="h-4 w-4" /> Cetak Lembar Stiker (A4)
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
          <div>
            <label className="text-slate-400 font-semibold block mb-1">Mulai Nomor Urut</label>
            <input
              type="number"
              min="1"
              value={startSeq}
              onChange={e => setStartSeq(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Jumlah Label</label>
            <select
              value={count}
              onChange={e => setCount(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-orange-500"
            >
              <option value="6">6 Label</option>
              <option value="12">12 Label (Standar A4)</option>
              <option value="18">18 Label</option>
              <option value="24">24 Label</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Kategori Aset</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-orange-500"
            >
              <option value="LPT">LPT (Laptop)</option>
              <option value="MON">MON (Monitor)</option>
              <option value="HPN">HPN (Smartphone)</option>
              <option value="PRN">PRN (Printer)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Entitas</label>
            <input
              type="text"
              disabled
              value="VMI (Voxxy Media)"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-slate-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Printable Sheet View */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200 print:border-none print:shadow-none print:p-0">
        <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center text-slate-900 print:mb-3">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-7 max-w-[120px] object-contain" />
            ) : (
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-orange-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">
                VMI
              </div>
            )}
            <div>
              <h3 className="text-sm font-black tracking-wide uppercase">
                VOXXY MEDIA INDONESIA — ASSET LABELS
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Batch: {stickers[0].assetCode} s/d {stickers[stickers.length - 1].assetCode}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-mono font-semibold">
            Format Kertas Label A4
          </span>
        </div>

        {/* Sticker Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
          {stickers.map((stk, idx) => (
            <div
              key={idx}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center bg-slate-50/50 print:border-solid print:border-slate-400 print:p-2"
            >
              {/* Header Label */}
              <div className="w-full flex items-center justify-between text-[8px] font-black text-slate-700 uppercase tracking-tight border-b border-slate-200 pb-1 mb-1">
                <span className="text-orange-600">VOXXY MEDIA</span>
                <span className="text-slate-500">IT INVENTORY</span>
              </div>

              {/* QR Image */}
              <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs my-1">
                <img
                  src={stk.qrUrl}
                  alt={stk.assetCode}
                  className="h-24 w-24 object-contain print:h-20 print:w-20"
                />
              </div>

              {/* Asset Code */}
              <div className="text-xs font-mono font-black text-slate-950 tracking-wider">
                {stk.assetCode}
              </div>
              <div className="text-[8px] text-slate-500 font-bold tracking-tight">
                SCAN WITH MOBILE CAMERA
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
