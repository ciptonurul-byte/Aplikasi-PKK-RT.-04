import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import {
  ProfilPKKRT,
  AnggotaPKK,
  KeluargaDasawisma,
  KegiatanPKK,
  TanamanToga,
  TransaksiKas,
  RekapIuranAnggota,
  SuratDinasPKK,
} from '../types/pkk';

export interface PKKCloudDataPayload {
  profil?: ProfilPKKRT;
  anggotaList?: AnggotaPKK[];
  keluargaList?: KeluargaDasawisma[];
  kegiatanList?: KegiatanPKK[];
  togaList?: TanamanToga[];
  transaksiList?: TransaksiKas[];
  iuranList?: RekapIuranAnggota[];
  suratList?: SuratDinasPKK[];
}

export interface CloudSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  totalSyncedItems: number;
}

/**
 * Recursively removes `undefined` properties from an object or array,
 * because Firestore SDK throws an unhandled error if any field is `undefined`.
 */
export function sanitizeForFirestore<T>(val: T): T {
  if (val === undefined) {
    return null as any;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (val instanceof Date) {
    return val.toISOString() as any;
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeForFirestore(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [k, v] of Object.entries(val as Record<string, any>)) {
    if (v !== undefined) {
      cleanObj[k] = sanitizeForFirestore(v);
    }
  }
  return cleanObj as T;
}

/**
 * Normalizes KeluargaDasawisma to guarantee no undefined fields before saving
 */
export function normalizeKeluargaForSave(k: KeluargaDasawisma): KeluargaDasawisma {
  return {
    ...k,
    noKk: (k.noKk || '').trim(),
    namaKepalaKeluarga: (k.namaKepalaKeluarga || '').trim(),
    namaIbu: (k.namaIbu || '').trim(),
    noHpIbu: (k.noHpIbu || '').trim(),
    alamat: (k.alamat || '').trim(),
    dasawisma: k.dasawisma || 'Dasawisma Flamboyan 9',
    jumlahAnggotaKeluarga: Math.max(1, Number(k.jumlahAnggotaKeluarga) || 1),
    jumlahLakiLaki: Number(k.jumlahLakiLaki) || 0,
    jumlahPerempuan: Number(k.jumlahPerempuan) || 0,
    jumlahBalita: Number(k.jumlahBalita) || 0,
    jumlahIbuHamil: Number(k.jumlahIbuHamil) || 0,
    jumlahLansia: Number(k.jumlahLansia) || 0,
    statusPUS: Boolean(k.statusPUS),
    statusWUS: Boolean(k.statusWUS),
    statusRumahSehat: Boolean(k.statusRumahSehat),
    memilikiJambanSehat: Boolean(k.memilikiJambanSehat),
    memilikiSPAL: Boolean(k.memilikiSPAL),
    memilikiTempatSampah: Boolean(k.memilikiTempatSampah),
    memilikiSumberAirBersih: Boolean(k.memilikiSumberAirBersih),
    memilikiPekaranganToga: Boolean(k.memilikiPekaranganToga),
    makananPokok: k.makananPokok || 'Beras',
    kategoriSejahtera: k.kategoriSejahtera || 'Sejahtera I',
    catatanKesehatan: k.catatanKesehatan || '',
    terakhirDiperbarui: k.terakhirDiperbarui || new Date().toISOString().split('T')[0],
    anggotaKeluarga: (k.anggotaKeluarga || []).map((m, idx) => ({
      ...m,
      id: m.id || `ak-${k.id}-${idx + 1}`,
      nama: (m.nama || '').trim(),
      nik: (m.nik || '').trim(),
      jenisKelamin: m.jenisKelamin || 'Perempuan',
      tempatLahir: m.tempatLahir || '',
      tanggalLahir: m.tanggalLahir || '',
      usia: typeof m.usia === 'number' ? m.usia : 30,
      pendidikan: m.pendidikan || 'SMA / SMK',
      jenisPekerjaan: m.jenisPekerjaan || 'Ibu Rumah Tangga',
      statusPernikahan: m.statusPernikahan || 'Kawin',
      statusHubungan: m.statusHubungan || 'ISTRI',
      noHp: m.noHp || '',
      kategoriSasaran: m.kategoriSasaran || 'Umum',
    })),
  };
}

/**
 * Commits multiple document write operations in atomic chunks of 400
 */
async function commitBatchOperations(
  ops: Array<{ ref: any; data: any; operation?: 'set' | 'delete' }>
): Promise<number> {
  const BATCH_SIZE = 400;
  let committed = 0;
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const chunk = ops.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const item of chunk) {
      if (item.operation === 'delete') {
        batch.delete(item.ref);
      } else {
        batch.set(item.ref, sanitizeForFirestore(item.data), { merge: true });
      }
    }
    await batch.commit();
    committed += chunk.length;
  }
  return committed;
}

// 1. Upload All Local Data to Firebase Cloud Firestore using atomic writeBatch
export async function pushAllDataToCloud(
  data: PKKCloudDataPayload
): Promise<{ success: boolean; totalUploaded: number }> {
  try {
    const nowIso = new Date().toISOString();
    const ops: Array<{ ref: any; data: any }> = [];

    // 1. Profil RT
    if (data.profil) {
      ops.push({
        ref: doc(db, 'pkk_profil', 'current'),
        data: {
          ...data.profil,
          cloudUpdatedAt: nowIso,
        },
      });
    }

    // 2. Anggota PKK
    if (data.anggotaList && data.anggotaList.length > 0) {
      for (const item of data.anggotaList) {
        if (item.id) {
          ops.push({
            ref: doc(db, 'pkk_anggota', item.id),
            data: item,
          });
        }
      }
    }

    // 3. Keluarga Dasawisma & Anggota Keluarga
    if (data.keluargaList && data.keluargaList.length > 0) {
      for (const item of data.keluargaList) {
        if (item.id) {
          ops.push({
            ref: doc(db, 'pkk_keluarga', item.id),
            data: normalizeKeluargaForSave(item),
          });
        }
      }
    }

    // 4. Kegiatan PKK
    if (data.kegiatanList && data.kegiatanList.length > 0) {
      for (const item of data.kegiatanList) {
        if (item.id) {
          ops.push({
            ref: doc(db, 'pkk_kegiatan', item.id),
            data: item,
          });
        }
      }
    }

    // 5. Tanaman TOGA
    if (data.togaList && data.togaList.length > 0) {
      for (const item of data.togaList) {
        if (item.id) {
          ops.push({
            ref: doc(db, 'pkk_toga', item.id),
            data: item,
          });
        }
      }
    }

    // 6. Transaksi Kas Umum
    if (data.transaksiList && data.transaksiList.length > 0) {
      for (const item of data.transaksiList) {
        if (item.id) {
          ops.push({
            ref: doc(db, 'pkk_transaksi', item.id),
            data: item,
          });
        }
      }
    }

    // 7. Rekap Iuran Anggota
    if (data.iuranList && data.iuranList.length > 0) {
      for (const item of data.iuranList) {
        if (item.anggotaId) {
          ops.push({
            ref: doc(db, 'pkk_iuran', item.anggotaId),
            data: item,
          });
        }
      }
    }

    // 8. Surat Dinas PKK
    if (data.suratList && data.suratList.length > 0) {
      for (const item of data.suratList) {
        if (item.id) {
          ops.push({
            ref: doc(db, 'pkk_surat', item.id),
            data: item,
          });
        }
      }
    }

    // Commit all operations atomically
    const count = await commitBatchOperations(ops);

    // Sync metadata
    await setDoc(doc(db, 'pkk_sync_meta', 'latest'), {
      lastSyncedAt: nowIso,
      totalItems: count,
      lastCollectionUpdated: 'all',
      deviceAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    });

    // Write connection test document
    try {
      await setDoc(doc(db, 'test', 'connection'), {
        status: 'ok',
        lastTestAt: nowIso,
      });
    } catch {
      // test doc is non-critical
    }

    return { success: true, totalUploaded: count };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'pushAllDataToCloud');
  }
}

// 2. Direct upload for imported Keluarga Dasawisma batch (ensures Excel import is instantly on Cloud)
export async function pushKeluargaBatchToCloud(
  keluargaList: KeluargaDasawisma[]
): Promise<{ success: boolean; totalUploaded: number }> {
  try {
    const ops: Array<{ ref: any; data: any }> = [];
    for (const item of keluargaList) {
      if (item.id) {
        ops.push({
          ref: doc(db, 'pkk_keluarga', item.id),
          data: normalizeKeluargaForSave(item),
        });
      }
    }

    const count = await commitBatchOperations(ops);
    const nowIso = new Date().toISOString();

    await setDoc(doc(db, 'pkk_sync_meta', 'latest'), {
      lastSyncedAt: nowIso,
      totalItems: count,
      lastCollectionUpdated: 'pkk_keluarga',
      deviceAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    });

    return { success: true, totalUploaded: count };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'pushKeluargaBatchToCloud');
  }
}

// 3. Pull All Data from Cloud Firestore to Local State
export async function pullAllDataFromCloud(): Promise<PKKCloudDataPayload | null> {
  try {
    // 1. Profil
    let profil: ProfilPKKRT | undefined;
    try {
      const profSnap = await getDoc(doc(db, 'pkk_profil', 'current'));
      if (profSnap.exists()) {
        profil = profSnap.data() as ProfilPKKRT;
      }
    } catch (e) {
      console.warn('Error reading pkk_profil:', e);
    }

    // 2. Anggota
    const anggotaList: AnggotaPKK[] = [];
    try {
      const aSnaps = await getDocs(collection(db, 'pkk_anggota'));
      aSnaps.forEach((d) => {
        const item = d.data() as AnggotaPKK;
        anggotaList.push({ ...item, id: item.id || d.id });
      });
    } catch (e) {
      console.warn('Error reading pkk_anggota:', e);
    }

    // 3. Keluarga
    const keluargaList: KeluargaDasawisma[] = [];
    try {
      const kSnaps = await getDocs(collection(db, 'pkk_keluarga'));
      kSnaps.forEach((d) => {
        const item = d.data() as KeluargaDasawisma;
        keluargaList.push({ ...item, id: item.id || d.id });
      });
    } catch (e) {
      console.warn('Error reading pkk_keluarga:', e);
    }

    // 4. Kegiatan
    const kegiatanList: KegiatanPKK[] = [];
    try {
      const kgSnaps = await getDocs(collection(db, 'pkk_kegiatan'));
      kgSnaps.forEach((d) => {
        const item = d.data() as KegiatanPKK;
        kegiatanList.push({ ...item, id: item.id || d.id });
      });
    } catch (e) {
      console.warn('Error reading pkk_kegiatan:', e);
    }

    // 5. TOGA
    const togaList: TanamanToga[] = [];
    try {
      const tSnaps = await getDocs(collection(db, 'pkk_toga'));
      tSnaps.forEach((d) => {
        const item = d.data() as TanamanToga;
        togaList.push({ ...item, id: item.id || d.id });
      });
    } catch (e) {
      console.warn('Error reading pkk_toga:', e);
    }

    // 6. Transaksi
    const transaksiList: TransaksiKas[] = [];
    try {
      const trSnaps = await getDocs(collection(db, 'pkk_transaksi'));
      trSnaps.forEach((d) => {
        const item = d.data() as TransaksiKas;
        transaksiList.push({ ...item, id: item.id || d.id });
      });
    } catch (e) {
      console.warn('Error reading pkk_transaksi:', e);
    }

    // 7. Iuran
    const iuranList: RekapIuranAnggota[] = [];
    try {
      const iSnaps = await getDocs(collection(db, 'pkk_iuran'));
      iSnaps.forEach((d) => {
        const item = d.data() as RekapIuranAnggota;
        iuranList.push({ ...item, anggotaId: item.anggotaId || d.id });
      });
    } catch (e) {
      console.warn('Error reading pkk_iuran:', e);
    }

    // 8. Surat
    const suratList: SuratDinasPKK[] = [];
    try {
      const sSnaps = await getDocs(collection(db, 'pkk_surat'));
      sSnaps.forEach((d) => {
        const item = d.data() as SuratDinasPKK;
        suratList.push({ ...item, id: item.id || d.id });
      });
    } catch (e) {
      console.warn('Error reading pkk_surat:', e);
    }

    const totalFound =
      (profil ? 1 : 0) +
      anggotaList.length +
      keluargaList.length +
      kegiatanList.length +
      togaList.length +
      transaksiList.length +
      iuranList.length +
      suratList.length;

    if (totalFound === 0) {
      return null;
    }

    return {
      profil,
      anggotaList,
      keluargaList,
      kegiatanList,
      togaList,
      transaksiList,
      iuranList,
      suratList,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'pullAllDataFromCloud');
  }
}

// 4. Save single document helper with sanitization
export async function saveEntityToCloud(
  collectionName: 'pkk_profil' | 'pkk_anggota' | 'pkk_keluarga' | 'pkk_kegiatan' | 'pkk_toga' | 'pkk_transaksi' | 'pkk_iuran' | 'pkk_surat',
  docId: string,
  data: any
): Promise<void> {
  try {
    const cleanData = collectionName === 'pkk_keluarga'
      ? normalizeKeluargaForSave(data)
      : sanitizeForFirestore(data);

    await setDoc(doc(db, collectionName, docId), cleanData, { merge: true });
    // Update timestamp
    await setDoc(
      doc(db, 'pkk_sync_meta', 'latest'),
      {
        lastSyncedAt: new Date().toISOString(),
        lastCollectionUpdated: collectionName,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`Failed to auto-sync document ${docId} to ${collectionName}:`, err);
  }
}

// 5. Delete single document helper
export async function deleteEntityFromCloud(
  collectionName: 'pkk_anggota' | 'pkk_keluarga' | 'pkk_kegiatan' | 'pkk_toga' | 'pkk_transaksi' | 'pkk_iuran' | 'pkk_surat',
  docId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (err) {
    console.warn(`Failed to delete document ${docId} from ${collectionName}:`, err);
  }
}
