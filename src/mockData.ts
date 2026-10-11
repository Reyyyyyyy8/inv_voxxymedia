import { Asset, HandoverRecord, ActivityLog, CategoryItem } from './types';

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { kode: 'LPT', nama: 'Laptop & Notebook', icon: 'Laptop', deskripsi: 'Laptop operasional karyawan & tim kreatif' },
  { kode: 'MON', nama: 'Monitor Eksternal', icon: 'Monitor', deskripsi: 'Display 24" - 27" tim video & designer' },
  { kode: 'HPN', nama: 'Smartphone Kantor', icon: 'Smartphone', deskripsi: 'HP operasional admin sosmed & marketing' },
  { kode: 'PRN', nama: 'Printer & Scanner', icon: 'Printer', deskripsi: 'Perangkat cetak dokumen finance/HR' },
];

export const INITIAL_ASSETS: Asset[] = [
  {
    kode_aset: '001-VMI-LPT',
    kategori: 'LPT',
    merk: 'Lenovo',
    tipe_model: 'ThinkPad E14 Gen 4',
    nomor_seri: 'PF-3X92KM',
    spesifikasi: 'Intel Core i5-1235U, RAM 16GB DDR4, SSD 512GB NVMe, Display 14" FHD IPS',
    tgl_beli: '2026-02-15',
    harga: 13500000,
    vendor: 'PT Sentra Pratama Niaga',
    kondisi: 'Baik (Normal)',
    status: 'Dipakai',
    lokasi: 'Voxxy HQ - Studio Kreatif',
    user_saat_ini: 'Bima Satria',
    departemen_user: 'Creative & Video Production',
    catatan: 'Unit prima, sudah dipasang anti-glare screen protector.',
    created_at: '2026-02-16 09:30:00',
    updated_at: '2026-02-18 14:10:00'
  },
  {
    kode_aset: '002-VMI-LPT',
    kategori: 'LPT',
    merk: 'Apple',
    tipe_model: 'MacBook Pro 14" M3 Pro',
    nomor_seri: 'C02HL99YMD6T',
    spesifikasi: 'Apple M3 Pro (11-core CPU, 14-core GPU), 18GB Unified Memory, SSD 512GB, Space Black',
    tgl_beli: '2026-03-01',
    harga: 32000000,
    vendor: 'iBox Central Park Jakarta',
    kondisi: 'Sangat Baik (Baru)',
    status: 'Tersedia',
    lokasi: 'Ruang Server / Gudang IT Lt. 2',
    user_saat_ini: '',
    departemen_user: '',
    catatan: 'Cadangan siap deploy untuk Lead Designer atau Produser baru.',
    created_at: '2026-03-02 11:00:00',
    updated_at: '2026-03-02 11:00:00'
  },
  {
    kode_aset: '003-VMI-LPT',
    kategori: 'LPT',
    merk: 'ASUS',
    tipe_model: 'ZenBook 14 OLED UX3402',
    nomor_seri: 'M8N0CX04918239A',
    spesifikasi: 'Intel Core i7-1360P, 16GB LPDDR5, SSD 1TB NVMe Gen4, 2.8K 90Hz OLED',
    tgl_beli: '2026-01-20',
    harga: 18200000,
    vendor: 'ASUS Official Store',
    kondisi: 'Baik (Normal)',
    status: 'Dipakai',
    lokasi: 'Voxxy HQ - Divisi Media Sosmed',
    user_saat_ini: 'Siti Rahmawati',
    departemen_user: 'Social Media & Brand Marketing',
    catatan: 'Bodi mulus, baterai health 98%.',
    created_at: '2026-01-22 10:15:00',
    updated_at: '2026-01-25 15:45:00'
  }
];

export const INITIAL_HANDOVERS: HandoverRecord[] = [
  {
    id_handover: 'HO-2026-001',
    no_surat: '001/BAST-IT/VMI/II/2026',
    kode_aset: '001-VMI-LPT',
    jenis_transaksi: 'Serah Terima Baru',
    tgl_handover: '2026-02-18',
    nama_penerima: 'Bima Satria',
    email_penerima: 'bima.satria@voxxymedia.id',
    nik_karyawan: 'VMI-2026-042',
    departemen: 'Creative & Video Production',
    jabatan: 'Motion Graphic Specialist',
    nama_petugas: 'Reyhan Fajri (IT/GA)',
    email_petugas: 'reyhanfajri88@gmail.com',
    kondisi_fisik: 'Unit baru mulus tanpa baret, keyboard dan layar berfungsi sempurna.',
    kelengkapan: [
      'Charger Adapter 65W Original',
      'Kabel USB-C Power Cord',
      'Tas Laptop Lenovo ThinkPad Backpack',
      'Mouse Wireless Logitech'
    ],
    catatan_kelengkapan: 'Laptop telah diinstal software Adobe CC Suite & antivirus resmi perusahaan.',
    ttd_penerima: 'DATA_URL_SAMPLE_RECEIVER',
    ttd_petugas: 'DATA_URL_SAMPLE_OFFICER',
    pdf_drive_link: 'https://drive.google.com/file/d/sample-bast-001/view',
    created_at: '2026-02-18 14:10:00'
  }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-02-16 09:30:00',
    user_admin: 'reyhanfajri88@gmail.com',
    aksi: 'REGISTRASI_BARU',
    kode_aset: '001-VMI-LPT',
    deskripsi: 'Registrasi unit Lenovo ThinkPad E14 Gen 4 ke inventaris sistem.'
  },
  {
    id: 'LOG-002',
    timestamp: '2026-02-18 14:10:00',
    user_admin: 'reyhanfajri88@gmail.com',
    aksi: 'HANDOVER',
    kode_aset: '001-VMI-LPT',
    deskripsi: 'Serah terima laptop kepada Bima Satria (Creative). BAST No: 001/BAST-IT/VMI/II/2026.'
  },
  {
    id: 'LOG-003',
    timestamp: '2026-03-02 11:00:00',
    user_admin: 'reyhanfajri88@gmail.com',
    aksi: 'REGISTRASI_BARU',
    kode_aset: '002-VMI-LPT',
    deskripsi: 'Registrasi MacBook Pro M3 Pro dari iBox Central Park.'
  }
];
