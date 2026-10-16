import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AnggotaPKK,
  KeluargaDasawisma,
  AnggotaKeluargaKK,
  AnggotaKeluargaTerpadu,
  DasawismaName,
  JabatanPKK,
  PokjaType,
  KegiatanPKK,
  TanamanToga,
  TransaksiKas,
  RekapIuranAnggota,
  IuranBulanStatus,
  SuratDinasPKK,
  ProfilPKKRT,
  AppView,
  UserRole,
  UserAccount,
  AuthSession,
} from '../types/pkk';
import {
  initialProfilPKK,
  initialAnggota,
  initialKeluargaDasawisma,
  initialKegiatan,
  initialTanamanToga,
  initialTransaksiKas,
  initialRekapIuran,
  initialSuratPKK,
  initialUserAccounts,
} from '../data/initialData';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  pushAllDataToCloud,
  pullAllDataFromCloud,
  saveEntityToCloud,
  deleteEntityFromCloud,
  CloudSyncStatus,
  PKKCloudDataPayload,
} from '../firebase/firestoreSync';
import { db, testFirestoreConnection } from '../firebase/config';

export type { UserRole, UserAccount, AuthSession, CloudSyncStatus };

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  timestamp: string;
  linkView?: AppView;
  read?: boolean;
}

interface PKKContextType {
  // Navigation & UI State
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  searchGlobal: string;
  setSearchGlobal: (query: string) => void;

  // Profile RT
  profil: ProfilPKKRT;
  updateProfil: (data: Partial<ProfilPKKRT>) => void;

  // CRUD Anggota
  anggotaList: AnggotaPKK[];
  addAnggota: (data: Omit<AnggotaPKK, 'id'>) => void;
  updateAnggota: (id: string, data: Partial<AnggotaPKK>) => void;
  deleteAnggota: (id: string) => void;

  // CRUD Keluarga & Dasawisma
  keluargaList: KeluargaDasawisma[];
  addKeluarga: (data: Omit<KeluargaDasawisma, 'id' | 'terakhirDiperbarui'>) => void;
  addKeluargaBatch: (
    dataList: Omit<KeluargaDasawisma, 'id' | 'terakhirDiperbarui'>[],
    upsert?: boolean
  ) => { added: number; updated: number; nextList: KeluargaDasawisma[] };
  updateKeluarga: (id: string, data: Partial<KeluargaDasawisma>) => void;
  deleteKeluarga: (id: string) => void;

  // Data Anggota Keluarga Lengkap (Terintegrasi Seluruh Modul)
  semuaAnggotaKeluarga: AnggotaKeluargaTerpadu[];
  selectedKeluargaFilterId: string;
  setSelectedKeluargaFilterId: (id: string) => void;
  addAnggotaKeluargaItem: (
    targetKK: {
      keluargaId?: string;
      noKk?: string;
      namaKepalaKeluarga?: string;
      namaIbu?: string;
      dasawisma?: DasawismaName;
      alamat?: string;
      kategoriSejahtera?: 'Pra Sejahtera' | 'Sejahtera I' | 'Sejahtera II' | 'Sejahtera III';
    },
    member: AnggotaKeluargaKK,
    pkkOptions?: {
      registerAsAnggotaPKK: boolean;
      jabatan?: JabatanPKK;
      pokja?: PokjaType;
      noHp?: string;
    }
  ) => void;
  updateAnggotaKeluargaItem: (
    keluargaId: string,
    memberId: string,
    updatedMember: AnggotaKeluargaKK
  ) => void;
  deleteAnggotaKeluargaItem: (keluargaId: string, memberId: string) => void;
  promoteAnggotaKeluargaToPKK: (
    member: AnggotaKeluargaTerpadu,
    jabatan: JabatanPKK,
    pokja: PokjaType,
    noHp: string
  ) => void;
  syncSemuaDataKeluargaDanAnggota: () => { syncedKK: number; syncedMembers: number };

  // CRUD Kegiatan
  kegiatanList: KegiatanPKK[];
  addKegiatan: (data: Omit<KegiatanPKK, 'id'>) => void;
  updateKegiatan: (id: string, data: Partial<KegiatanPKK>) => void;
  deleteKegiatan: (id: string) => void;

  // CRUD TOGA
  togaList: TanamanToga[];
  addToga: (data: Omit<TanamanToga, 'id'>) => void;
  updateToga: (id: string, data: Partial<TanamanToga>) => void;
  deleteToga: (id: string) => void;
  catatPanenToga: (id: string, hasilKg: number) => void;

  // CRUD Kas Keuangan
  transaksiList: TransaksiKas[];
  addTransaksi: (data: Omit<TransaksiKas, 'id'>) => void;
  updateTransaksi: (id: string, data: Partial<TransaksiKas>) => void;
  deleteTransaksi: (id: string) => void;

  // Iuran Bulanan
  iuranList: RekapIuranAnggota[];
  toggleIuranBulan: (anggotaId: string, bulan: number) => void;
  inputIuranAnggota: (params: {
    anggotaId: string;
    bulanList: number[];
    nominalPerBulan: number;
    tanggalBayar: string;
    metodeBayar?: 'Tunai' | 'Transfer';
    catatan?: string;
    catatKeKas?: boolean;
  }) => void;
  addPesertaIuran: (data: {
    namaAnggota: string;
    jabatan: string;
    dasawisma?: string;
    noHp?: string;
    tahun?: number;
    syncToAnggota?: boolean;
  }) => string;
  updatePesertaIuran: (
    anggotaId: string,
    data: {
      namaAnggota?: string;
      jabatan?: string;
      dasawisma?: string;
      noHp?: string;
      bulan?: { [k: number]: IuranBulanStatus };
    }
  ) => void;
  deletePesertaIuran: (anggotaId: string) => void;
  syncIuranFromAnggotaDanDasawisma: () => { addedCount: number };

  // Surat & Dokumen
  suratList: SuratDinasPKK[];
  addSurat: (data: Omit<SuratDinasPKK, 'id' | 'dibuatTanggal'>) => void;
  updateSurat: (id: string, data: Partial<SuratDinasPKK>) => void;
  deleteSurat: (id: string) => void;

  // Analytics Computed
  saldoKas: number;
  totalKasMasuk: number;
  totalKasKeluar: number;
  totalJiwaDasawisma: number;
  totalLakiLaki: number;
  totalPerempuan: number;
  totalBalita: number;
  totalIbuHamil: number;
  totalLansia: number;
  persentaseRumahSehat: number;
  totalPolybagToga: number;
  togaSiapPanenCount: number;

  // Notifications
  notifications: NotificationItem[];
  dismissNotification: (id: string) => void;

  // Persistence Operations
  clearAllData: () => void;
  resetToDefaultData: () => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;

  // Authentication & Users
  currentUser: AuthSession | null;
  isAuthenticated: boolean;
  userAccounts: UserAccount[];
  login: (username: string, password: string, remember?: boolean) => { success: boolean; message?: string };
  logout: () => void;
  changePassword: (username: string, oldPassword: string, newPassword: string) => { success: boolean; message?: string };
  resetPasswordToDefault: (username: string) => boolean;
  quickLogin: (username: string) => boolean;

  // Firebase Cloud Sync
  cloudSyncStatus: CloudSyncStatus;
  syncToCloud: (customPayload?: Partial<PKKCloudDataPayload>) => Promise<{ success: boolean; totalUploaded: number }>;
  syncFromCloud: () => Promise<boolean>;
  isCloudModalOpen: boolean;
  setIsCloudModalOpen: (open: boolean) => void;
}

const PKKContext = createContext<PKKContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFIL: 'pkk_rt_profil_v2',
  ANGGOTA: 'pkk_rt_anggota_v2',
  KELUARGA: 'pkk_rt_keluarga_v2',
  KEGIATAN: 'pkk_rt_kegiatan_v2',
  TOGA: 'pkk_rt_toga_v2',
  TRANSAKSI: 'pkk_rt_transaksi_v2',
  IURAN: 'pkk_rt_iuran_v2',
  SURAT: 'pkk_rt_surat_v2',
  DARK_MODE: 'pkk_rt_dark_mode',
  ROLE: 'pkk_rt_role',
  AUTH_SESSION: 'pkk_rt_auth_session_v2',
  USER_ACCOUNTS: 'pkk_rt_user_accounts_v2',
};

// Clean up previous v1 cache if exists
if (typeof window !== 'undefined') {
  const oldKeys = [
    'pkk_rt_profil_v1',
    'pkk_rt_anggota_v1',
    'pkk_rt_keluarga_v1',
    'pkk_rt_kegiatan_v1',
    'pkk_rt_toga_v1',
    'pkk_rt_transaksi_v1',
    'pkk_rt_iuran_v1',
    'pkk_rt_surat_v1',
  ];
  oldKeys.forEach((k) => localStorage.removeItem(k));
}

export const PKKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & View
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole) || 'Ketua TP PKK';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
  });
  const [searchGlobal, setSearchGlobal] = useState<string>('');
  const [selectedKeluargaFilterId, setSelectedKeluargaFilterId] = useState<string>('Semua');

  // Firebase Cloud Sync State
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSyncedAt: typeof window !== 'undefined' ? localStorage.getItem('pkk_last_cloud_sync') : null,
    error: null,
    totalSyncedItems: 0,
  });

  // Authentication & Users State
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_ACCOUNTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return initialUserAccounts;
  });

  const [currentUser, setCurrentUser] = useState<AuthSession | null>(() => {
    const saved =
      localStorage.getItem(STORAGE_KEYS.AUTH_SESSION) ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION) : null);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const isAuthenticated = !!currentUser;

  // Primary Entities with LocalStorage caching
  const [profil, setProfil] = useState<ProfilPKKRT>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFIL);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.provinsi === 'Jawa Barat') {
          parsed.provinsi = 'Jawa Tengah';
          localStorage.setItem(STORAGE_KEYS.PROFIL, JSON.stringify(parsed));
        }
        return parsed;
      } catch {
        return initialProfilPKK;
      }
    }
    return initialProfilPKK;
  });

  const [anggotaList, setAnggotaList] = useState<AnggotaPKK[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ANGGOTA);
    return saved ? JSON.parse(saved) : initialAnggota;
  });

  const normalizeSavedDasawisma = (name: string): DasawismaName => {
    if (name === 'Dasawisma Melati 1') return 'Dasawisma Flamboyan 9';
    if (name === 'Dasawisma Mawar 2') return 'Dasawisma Flamboyan 10';
    if (
      name === 'Dasawisma Anggrek 3' ||
      name === 'Dasawisma Dahlia 4' ||
      name === 'Dasawisma Kenanga 5'
    ) {
      return 'Dasawisma Flamboyan 11';
    }
    if (
      name === 'Dasawisma Flamboyan 9' ||
      name === 'Dasawisma Flamboyan 10' ||
      name === 'Dasawisma Flamboyan 11'
    ) {
      return name;
    }
    return 'Dasawisma Flamboyan 9';
  };

  const [keluargaList, setKeluargaList] = useState<KeluargaDasawisma[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KELUARGA);
    if (!saved) return initialKeluargaDasawisma;
    try {
      const parsed: KeluargaDasawisma[] = JSON.parse(saved);
      return parsed.map((k) => ({
        ...k,
        dasawisma: normalizeSavedDasawisma(k.dasawisma),
      }));
    } catch {
      return initialKeluargaDasawisma;
    }
  });

  const [kegiatanList, setKegiatanList] = useState<KegiatanPKK[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KEGIATAN);
    return saved ? JSON.parse(saved) : initialKegiatan;
  });

  const [togaList, setTogaList] = useState<TanamanToga[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TOGA);
    if (!saved) return initialTanamanToga;
    try {
      const parsed: TanamanToga[] = JSON.parse(saved);
      return parsed.map((t) => ({
        ...t,
        lokasiDasawisma:
          t.lokasiDasawisma === 'Pekarangan HATINYA PKK RT'
            ? 'Pekarangan HATINYA PKK RT'
            : normalizeSavedDasawisma(t.lokasiDasawisma),
      }));
    } catch {
      return initialTanamanToga;
    }
  });

  const [transaksiList, setTransaksiList] = useState<TransaksiKas[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSAKSI);
    return saved ? JSON.parse(saved) : initialTransaksiKas;
  });

  const [iuranList, setIuranList] = useState<RekapIuranAnggota[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IURAN);
    return saved ? JSON.parse(saved) : initialRekapIuran;
  });

  const [suratList, setSuratList] = useState<SuratDinasPKK[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SURAT);
    return saved ? JSON.parse(saved) : initialSuratPKK;
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFIL, JSON.stringify(profil));
  }, [profil]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANGGOTA, JSON.stringify(anggotaList));
  }, [anggotaList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KELUARGA, JSON.stringify(keluargaList));
  }, [keluargaList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(kegiatanList));
  }, [kegiatanList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TOGA, JSON.stringify(togaList));
  }, [togaList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(transaksiList));
  }, [transaksiList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IURAN, JSON.stringify(iuranList));
  }, [iuranList]);

  // Auto-sync any AnggotaPKK that is not yet in iuranList
  useEffect(() => {
    if (anggotaList.length === 0) return;
    setIuranList((prev) => {
      const existingIds = new Set(prev.map((i) => i.anggotaId));
      const existingNames = new Set(prev.map((i) => i.namaAnggota.trim().toLowerCase()));
      const missing = anggotaList.filter(
        (a) => !existingIds.has(a.id) && !existingNames.has(a.nama.trim().toLowerCase())
      );
      if (missing.length === 0) return prev;

      const defaultBulan: { [k: number]: IuranBulanStatus } = {};
      for (let m = 1; m <= 12; m++) {
        defaultBulan[m] = { lunas: false, nominal: profil.iuranBulananNominal };
      }

      const newRecords: RekapIuranAnggota[] = missing.map((a) => ({
        anggotaId: a.id,
        namaAnggota: a.nama,
        jabatan: a.jabatan,
        noHp: a.noHp,
        tahun: new Date().getFullYear(),
        bulan: { ...defaultBulan },
      }));

      return [...prev, ...newRecords];
    });
  }, [anggotaList, profil.iuranBulananNominal]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(suratList));
  }, [suratList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Firebase Cloud Sync Functions
  const syncToCloud = async (
    customPayload?: Partial<PKKCloudDataPayload>
  ): Promise<{ success: boolean; totalUploaded: number }> => {
    setCloudSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
    try {
      const payload: PKKCloudDataPayload = {
        profil: customPayload?.profil || profil,
        anggotaList: customPayload?.anggotaList || anggotaList,
        keluargaList: customPayload?.keluargaList || keluargaList,
        kegiatanList: customPayload?.kegiatanList || kegiatanList,
        togaList: customPayload?.togaList || togaList,
        transaksiList: customPayload?.transaksiList || transaksiList,
        iuranList: customPayload?.iuranList || iuranList,
        suratList: customPayload?.suratList || suratList,
      };
      const res = await pushAllDataToCloud(payload);
      const now = new Date().toISOString();
      if (typeof window !== 'undefined') localStorage.setItem('pkk_last_cloud_sync', now);
      setCloudSyncStatus({
        isOnline: true,
        isSyncing: false,
        lastSyncedAt: now,
        error: null,
        totalSyncedItems: res?.totalUploaded || 0,
      });
      return { success: true, totalUploaded: res?.totalUploaded || 0 };
    } catch (err: any) {
      setCloudSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Gagal sinkronisasi ke Cloud',
      }));
      return { success: false, totalUploaded: 0 };
    }
  };

  const syncFromCloud = async (): Promise<boolean> => {
    setCloudSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
    try {
      const cloudData = await pullAllDataFromCloud();
      if (cloudData) {
        if (cloudData.profil) setProfil(cloudData.profil);
        if (cloudData.anggotaList && cloudData.anggotaList.length > 0) setAnggotaList(cloudData.anggotaList);
        if (cloudData.keluargaList && cloudData.keluargaList.length > 0) setKeluargaList(cloudData.keluargaList);
        if (cloudData.kegiatanList && cloudData.kegiatanList.length > 0) setKegiatanList(cloudData.kegiatanList);
        if (cloudData.togaList && cloudData.togaList.length > 0) setTogaList(cloudData.togaList);
        if (cloudData.transaksiList && cloudData.transaksiList.length > 0) setTransaksiList(cloudData.transaksiList);
        if (cloudData.iuranList && cloudData.iuranList.length > 0) setIuranList(cloudData.iuranList);
        if (cloudData.suratList && cloudData.suratList.length > 0) setSuratList(cloudData.suratList);
      }
      const now = new Date().toISOString();
      if (typeof window !== 'undefined') localStorage.setItem('pkk_last_cloud_sync', now);
      setCloudSyncStatus({
        isOnline: true,
        isSyncing: false,
        lastSyncedAt: now,
        error: null,
        totalSyncedItems: 0,
      });
      return true;
    } catch (err: any) {
      setCloudSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Gagal menarik data dari Cloud',
      }));
      return false;
    }
  };

  const initialSyncDoneRef = React.useRef(false);

  // Bidirectional auto-connect and sync on initial load
  useEffect(() => {
    let isMounted = true;
    const initializeFirebaseCloud = async () => {
      try {
        const isOnline = await testFirestoreConnection();
        if (!isMounted) return;
        setCloudSyncStatus((prev) => ({ ...prev, isOnline }));

        // Attempt pull from cloud Firestore
        const cloudData = await pullAllDataFromCloud();
        if (cloudData && isMounted) {
          if (cloudData.profil) setProfil(cloudData.profil);
          if (cloudData.anggotaList && cloudData.anggotaList.length > 0) setAnggotaList(cloudData.anggotaList);
          if (cloudData.keluargaList && cloudData.keluargaList.length > 0) setKeluargaList(cloudData.keluargaList);
          if (cloudData.kegiatanList && cloudData.kegiatanList.length > 0) setKegiatanList(cloudData.kegiatanList);
          if (cloudData.togaList && cloudData.togaList.length > 0) setTogaList(cloudData.togaList);
          if (cloudData.transaksiList && cloudData.transaksiList.length > 0) setTransaksiList(cloudData.transaksiList);
          if (cloudData.iuranList && cloudData.iuranList.length > 0) setIuranList(cloudData.iuranList);
          if (cloudData.suratList && cloudData.suratList.length > 0) setSuratList(cloudData.suratList);
          setCloudSyncStatus((prev) => ({
            ...prev,
            isOnline: true,
            lastSyncedAt: new Date().toISOString(),
            error: null,
          }));
        } else if (!cloudData && isOnline) {
          // If cloud is empty, seed it with initial local data
          await pushAllDataToCloud({
            profil,
            anggotaList,
            keluargaList,
            kegiatanList,
            togaList,
            transaksiList,
            iuranList,
            suratList,
          });
          if (isMounted) {
            setCloudSyncStatus((prev) => ({
              ...prev,
              lastSyncedAt: new Date().toISOString(),
            }));
          }
        }
      } catch (e) {
        console.warn('Initial Firebase check skipped, using local storage:', e);
      } finally {
        if (isMounted) {
          initialSyncDoneRef.current = true;
        }
      }
    };

    initializeFirebaseCloud();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time synchronization across devices using Firestore onSnapshot
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(
        doc(db, 'pkk_sync_meta', 'latest'),
        (snapshot) => {
          if (!snapshot.exists()) return;
          const meta = snapshot.data();
          const remoteTime = meta?.lastSyncedAt;
          const localTime = typeof window !== 'undefined' ? localStorage.getItem('pkk_last_cloud_sync') : null;

          // If another device pushed newer data to Cloud, pull and update automatically!
          if (remoteTime && remoteTime !== localTime && initialSyncDoneRef.current) {
            pullAllDataFromCloud().then((cloudData) => {
              if (cloudData) {
                if (cloudData.profil) setProfil(cloudData.profil);
                if (cloudData.anggotaList && cloudData.anggotaList.length > 0) setAnggotaList(cloudData.anggotaList);
                if (cloudData.keluargaList && cloudData.keluargaList.length > 0) setKeluargaList(cloudData.keluargaList);
                if (cloudData.kegiatanList && cloudData.kegiatanList.length > 0) setKegiatanList(cloudData.kegiatanList);
                if (cloudData.togaList && cloudData.togaList.length > 0) setTogaList(cloudData.togaList);
                if (cloudData.transaksiList && cloudData.transaksiList.length > 0) setTransaksiList(cloudData.transaksiList);
                if (cloudData.iuranList && cloudData.iuranList.length > 0) setIuranList(cloudData.iuranList);
                if (cloudData.suratList && cloudData.suratList.length > 0) setSuratList(cloudData.suratList);
                if (typeof window !== 'undefined') localStorage.setItem('pkk_last_cloud_sync', remoteTime);
                setCloudSyncStatus((prev) => ({
                  ...prev,
                  isOnline: true,
                  lastSyncedAt: remoteTime,
                  error: null,
                }));
              }
            }).catch((e) => {
              console.warn('Cross-device live sync pull caught:', e);
            });
          }
        },
        (error) => {
          console.warn('onSnapshot error on pkk_sync_meta:', error);
        }
      );
    } catch (e) {
      console.warn('Could not attach onSnapshot:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Auto-sync debounced state changes to Firebase Cloud Firestore
  useEffect(() => {
    if (!cloudSyncStatus.isOnline || !initialSyncDoneRef.current) return;
    const timer = setTimeout(async () => {
      try {
        await pushAllDataToCloud({
          profil,
          anggotaList,
          keluargaList,
          kegiatanList,
          togaList,
          transaksiList,
          iuranList,
          suratList,
        });
        const now = new Date().toISOString();
        if (typeof window !== 'undefined') localStorage.setItem('pkk_last_cloud_sync', now);
        setCloudSyncStatus((prev) => ({
          ...prev,
          lastSyncedAt: now,
          error: null,
        }));
      } catch (err: any) {
        console.warn('Auto-sync to cloud error:', err);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [
    profil,
    anggotaList,
    keluargaList,
    kegiatanList,
    togaList,
    transaksiList,
    iuranList,
    suratList,
    cloudSyncStatus.isOnline,
  ]);

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    if (currentUser) {
      const correspondingUser = userAccounts.find((u) => u.role === role);
      if (correspondingUser) {
        let displayName = correspondingUser.namaDefault;
        if (role === 'Ketua TP PKK' && profil.namaKetua) displayName = profil.namaKetua;
        else if (role === 'Sekretaris' && profil.namaSekretaris) displayName = profil.namaSekretaris;
        else if (role === 'Bendahara' && profil.namaBendahara) displayName = profil.namaBendahara;

        const updatedSession: AuthSession = {
          ...currentUser,
          username: correspondingUser.username,
          role,
          displayName,
        };
        setCurrentUser(updatedSession);
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(updatedSession));
      }
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Profile Actions
  const updateProfil = (data: Partial<ProfilPKKRT>) => {
    setProfil((prev) => {
      const updated = { ...prev, ...data };
      saveEntityToCloud('pkk_profil', 'current', updated);
      return updated;
    });
  };

  // Anggota Actions
  const addAnggota = (data: Omit<AnggotaPKK, 'id'>) => {
    const newId = `agt-${Date.now().toString().slice(-4)}`;
    const newMember: AnggotaPKK = { ...data, id: newId };
    setAnggotaList((prev) => [newMember, ...prev]);
    saveEntityToCloud('pkk_anggota', newId, newMember);

    // Also initialize iuran record for new member
    const newIuran: RekapIuranAnggota = {
      anggotaId: newId,
      namaAnggota: data.nama,
      jabatan: data.jabatan,
      noHp: data.noHp,
      tahun: new Date().getFullYear(),
      bulan: {
        1: { lunas: false, nominal: profil.iuranBulananNominal },
        2: { lunas: false, nominal: profil.iuranBulananNominal },
        3: { lunas: false, nominal: profil.iuranBulananNominal },
        4: { lunas: false, nominal: profil.iuranBulananNominal },
        5: { lunas: false, nominal: profil.iuranBulananNominal },
        6: { lunas: false, nominal: profil.iuranBulananNominal },
        7: { lunas: false, nominal: profil.iuranBulananNominal },
        8: { lunas: false, nominal: profil.iuranBulananNominal },
        9: { lunas: false, nominal: profil.iuranBulananNominal },
        10: { lunas: false, nominal: profil.iuranBulananNominal },
        11: { lunas: false, nominal: profil.iuranBulananNominal },
        12: { lunas: false, nominal: profil.iuranBulananNominal },
      },
    };
    setIuranList((prev) => [...prev, newIuran]);
    saveEntityToCloud('pkk_iuran', newId, newIuran);
  };

  const updateAnggota = (id: string, data: Partial<AnggotaPKK>) => {
    setAnggotaList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...data };
          saveEntityToCloud('pkk_anggota', id, updated);
          return updated;
        }
        return item;
      })
    );
    if (data.nama || data.jabatan || data.noHp !== undefined) {
      setIuranList((prev) =>
        prev.map((i) => {
          if (i.anggotaId === id) {
            const updatedIuran = {
              ...i,
              namaAnggota: data.nama || i.namaAnggota,
              jabatan: data.jabatan || i.jabatan,
              noHp: data.noHp !== undefined ? data.noHp : i.noHp,
            };
            saveEntityToCloud('pkk_iuran', id, updatedIuran);
            return updatedIuran;
          }
          return i;
        })
      );
    }
  };

  const deleteAnggota = (id: string) => {
    setAnggotaList((prev) => prev.filter((item) => item.id !== id));
    setIuranList((prev) => prev.filter((item) => item.anggotaId !== id));
    deleteEntityFromCloud('pkk_anggota', id);
    deleteEntityFromCloud('pkk_iuran', id);
  };

  // Helper to check if a member name is an old generic placeholder
  const isGenericMemberPlaceholder = (nama: string): boolean => {
    const clean = (nama || '').trim();
    if (!clean) return true;
    return /^(Putra|Putri)\s+\d+\s+Kel\.|^Ananda\s+.*\s+\d+$|^(Kakek|Nenek)\s+Kel\.|^Anak\s*(ke-)?\s*\d+$/i.test(
      clean
    );
  };

  // Helper to generate natural Indonesian individual names when only family counts are provided
  const generateRealisticMemberName = (
    gender: 'Laki-laki' | 'Perempuan',
    kategori: 'Balita' | 'Anak' | 'Lansia',
    kkName: string,
    memberOrderIndex: number,
    kkSeed: string
  ): string => {
    const cleanKK = kkName
      .replace(/^(Bpk\.?|Bapak|Ibu|Ny\.?|Nyonya|H\.?|Hj\.?|Drs\.?|Ir\.?|Sdr\.?|Tn\.?)\s+/gi, '')
      .replace(/,\s*[A-Za-z.]+$/g, '')
      .trim();
    const parts = cleanKK.split(/\s+/).filter(Boolean);
    const familyLastName = parts.length > 1 ? parts[parts.length - 1] : parts[0] || 'Pratama';

    // Deterministic seed from kkSeed + memberOrderIndex
    let hash = memberOrderIndex * 7;
    for (let i = 0; i < kkSeed.length; i++) {
      hash = (hash * 31 + kkSeed.charCodeAt(i)) % 997;
    }

    const maleChildFirstNames = [
      'Muhammad Rizky',
      'Dimas Aditya',
      'Fajar Nugraha',
      'Bagas Saputra',
      'Rafa Alfarizi',
      'Arka Daniswara',
      'Naufal Ramadhan',
      'Reza Maulana',
      'Aldi Firmansyah',
      'Bayu Setiawan',
      'Daffa Pratama',
      'Farhan Akbar',
    ];
    const femaleChildFirstNames = [
      'Aisyah Putri',
      'Nabila Azzahra',
      'Kirana Larasati',
      'Zahra Amalia',
      'Nadira Kusuma',
      'Tiara Maharani',
      'Salsabila Putri',
      'Alya Rahmawati',
      'Citra Lestari',
      'Dinda Permata',
      'Syifa Nuraini',
      'intan Permatasari',
    ];
    const maleBalitaFirstNames = [
      'Muhammad Arka',
      'Rayyan Alfarizqi',
      'Zayn Malik',
      'Kenzo Aditya',
      'Alfatih Ramadhan',
      'Rafاردan Putra'.replace(/[^a-zA-Z\s]/g, 'Rafardhan '),
      'Gibran Alghifari',
      'Keano Pratama',
    ];
    const femaleBalitaFirstNames = [
      'Aisyah Humaira',
      'Khaira Lubna',
      'Inara Putri',
      'Zea Almahyra',
      'Shafira Azzahra',
      'Naura Jasmin',
      'Aqila Maharani',
      'Freya Kirana',
    ];
    const maleLansiaNames = [
      'H. Sudirman',
      'Soeparno',
      'Karso Wijoyo',
      'Bambang Sutrisno',
      'H. Sulaiman',
      'Mulyono',
    ];
    const femaleLansiaNames = [
      'Hj. Aminah',
      'Sri Wahyuni',
      'Sutini',
      'Hj. Fatimah',
      'Sumiati',
      'Suparmi',
    ];

    if (kategori === 'Lansia') {
      const list = gender === 'Laki-laki' ? maleLansiaNames : femaleLansiaNames;
      return list[(hash + memberOrderIndex) % list.length];
    }

    if (kategori === 'Balita') {
      const list = gender === 'Laki-laki' ? maleBalitaFirstNames : femaleBalitaFirstNames;
      const picked = list[(hash + memberOrderIndex) % list.length];
      return picked.toLowerCase().includes(familyLastName.toLowerCase())
        ? picked
        : `${picked} ${familyLastName}`;
    }

    const list = gender === 'Laki-laki' ? maleChildFirstNames : femaleChildFirstNames;
    const picked = list[(hash + memberOrderIndex) % list.length];
    const capitalizedPicked = picked.charAt(0).toUpperCase() + picked.slice(1);
    return capitalizedPicked.toLowerCase().includes(familyLastName.toLowerCase())
      ? capitalizedPicked
      : `${capitalizedPicked} ${familyLastName}`;
  };

  // Keluarga Dasawisma Actions & Helpers
  const ensureMembersForKeluarga = (
    data: Omit<KeluargaDasawisma, 'id' | 'terakhirDiperbarui'> | KeluargaDasawisma,
    kkIdPrefix: string
  ): AnggotaKeluargaKK[] => {
    const cleanKKName = (data.namaKepalaKeluarga || 'Kepala Keluarga').trim();
    const cleanIbuName = (data.namaIbu || '').trim();
    const seedKey = `${data.noKk || kkIdPrefix}-${cleanKKName}`;
    const baseNik = (data.noKk || '3201010101010001').replace(/\D/g, '').padEnd(12, '0').slice(0, 12);
    const isSingleMotherHead =
      Boolean(cleanIbuName) && cleanKKName.toLowerCase() === cleanIbuName.toLowerCase();

    const generated: AnggotaKeluargaKK[] = [];

    if (data.anggotaKeluarga && data.anggotaKeluarga.length > 0) {
      data.anggotaKeluarga.forEach((m, idx) => {
        const hubungan =
          m.statusHubungan || (idx === 0 ? 'KEPALA KELUARGA' : idx === 1 ? 'ISTRI' : 'ANAK');
        const gender: 'Laki-laki' | 'Perempuan' =
          m.jenisKelamin || (idx === 1 ? 'Perempuan' : 'Laki-laki');
        const kat: 'Balita' | 'Anak' | 'Lansia' =
          m.kategoriSasaran === 'Balita' || (typeof m.usia === 'number' && m.usia <= 5)
            ? 'Balita'
            : m.kategoriSasaran === 'Lansia' || (typeof m.usia === 'number' && m.usia >= 60)
            ? 'Lansia'
            : 'Anak';

        const resolvedName = isGenericMemberPlaceholder(m.nama)
          ? hubungan.toUpperCase() === 'KEPALA KELUARGA'
            ? cleanKKName
            : hubungan.toUpperCase() === 'ISTRI'
            ? cleanIbuName && cleanIbuName !== '-'
              ? cleanIbuName
              : cleanKKName
            : generateRealisticMemberName(gender, kat, cleanKKName, idx + 1, seedKey)
          : m.nama;

        generated.push({
          ...m,
          nama: resolvedName,
          id: m.id || `ak-${kkIdPrefix}-${idx + 1}`,
          nik:
            m.nik ||
            `${baseNik}${String(idx + 1).padStart(4, '0')}`,
          statusHubungan: hubungan,
          jenisKelamin: gender,
        });
      });
    } else {
      const requestedTotal = Math.max(1, Number(data.jumlahAnggotaKeluarga) || 1);

      // 1. Kepala Keluarga
      generated.push({
        id: `ak-${kkIdPrefix}-1`,
        nama: cleanKKName,
        nik: `${baseNik}0001`,
        jenisKelamin: isSingleMotherHead ? 'Perempuan' : 'Laki-laki',
        usia: 42,
        pendidikan: 'SMA / SMK',
        jenisPekerjaan: isSingleMotherHead ? 'Wiraswasta' : 'Karyawan / Wiraswasta',
        statusPernikahan: isSingleMotherHead ? 'Cerai Hidup / Mati' : 'Kawin',
        statusHubungan: 'KEPALA KELUARGA',
        agama: 'Islam',
        kategoriSasaran: data.statusPUS ? 'PUS' : 'Umum',
      });

      // 2. Istri / Ibu Rumah Tangga (only if total family members >= 2)
      if (requestedTotal >= 2 && cleanIbuName && cleanIbuName !== '-' && !isSingleMotherHead) {
        generated.push({
          id: `ak-${kkIdPrefix}-2`,
          nama: cleanIbuName,
          nik: `${baseNik}0002`,
          jenisKelamin: 'Perempuan',
          usia: 37,
          pendidikan: 'SMA / SMK',
          jenisPekerjaan: 'Ibu Rumah Tangga',
          statusPernikahan: 'Kawin',
          statusHubungan: 'ISTRI',
          noHp: (data as any).noHpIbu || undefined,
          agama: 'Islam',
          kategoriSasaran:
            (Number(data.jumlahIbuHamil) || 0) > 0
              ? 'Ibu Hamil'
              : data.statusWUS
              ? 'WUS'
              : data.statusPUS
              ? 'PUS'
              : 'Umum',
        });
      }
    }

    // 3. Pad with additional Balita / Lansia / Anak if jumlahAnggotaKeluarga is higher than current list length
    const totalTarget = Math.max(
      generated.length,
      Number(data.jumlahAnggotaKeluarga) || generated.length
    );
    let currentIdx = generated.length + 1;

    const existingBalita = generated.filter(
      (g) => g.kategoriSasaran === 'Balita' || (typeof g.usia === 'number' && g.usia <= 5)
    ).length;
    const existingLansia = generated.filter(
      (g) => g.kategoriSasaran === 'Lansia' || (typeof g.usia === 'number' && g.usia >= 60)
    ).length;

    let remainingBalita = Math.max(0, (Number(data.jumlahBalita) || 0) - existingBalita);
    let remainingLansia = Math.max(0, (Number(data.jumlahLansia) || 0) - existingLansia);

    while (generated.length < totalTarget) {
      const currentLaki = generated.filter((g) => g.jenisKelamin === 'Laki-laki').length;
      const targetLaki = Number(data.jumlahLakiLaki) || Math.ceil(totalTarget / 2);
      const gender: 'Laki-laki' | 'Perempuan' = currentLaki < targetLaki ? 'Laki-laki' : 'Perempuan';

      if (remainingBalita > 0) {
        generated.push({
          id: `ak-${kkIdPrefix}-${currentIdx}`,
          nama: generateRealisticMemberName(gender, 'Balita', cleanKKName, currentIdx, seedKey),
          nik: `${baseNik}${String(currentIdx).padStart(4, '0')}`,
          jenisKelamin: gender,
          usia: 3,
          pendidikan: 'Belum Sekolah / PAUD',
          jenisPekerjaan: 'Belum Bekerja',
          statusPernikahan: 'Belum Kawin',
          statusHubungan: 'ANAK',
          agama: 'Islam',
          namaAyah: cleanKKName,
          namaIbu: cleanIbuName || '-',
          kategoriSasaran: 'Balita',
        });
        remainingBalita--;
      } else if (remainingLansia > 0) {
        generated.push({
          id: `ak-${kkIdPrefix}-${currentIdx}`,
          nama: generateRealisticMemberName(gender, 'Lansia', cleanKKName, currentIdx, seedKey),
          nik: `${baseNik}${String(currentIdx).padStart(4, '0')}`,
          jenisKelamin: gender,
          usia: 66,
          pendidikan: 'SD / Sederajat',
          jenisPekerjaan: 'Pensiunan / Lansia',
          statusPernikahan: 'Kawin',
          statusHubungan: 'ORANG TUA',
          agama: 'Islam',
          kategoriSasaran: 'Lansia',
        });
        remainingLansia--;
      } else {
        generated.push({
          id: `ak-${kkIdPrefix}-${currentIdx}`,
          nama: generateRealisticMemberName(gender, 'Anak', cleanKKName, currentIdx, seedKey),
          nik: `${baseNik}${String(currentIdx).padStart(4, '0')}`,
          jenisKelamin: gender,
          usia: 12,
          pendidikan: 'SMP / Sederajat',
          jenisPekerjaan: 'Pelajar / Mahasiswa',
          statusPernikahan: 'Belum Kawin',
          statusHubungan: 'ANAK',
          agama: 'Islam',
          namaAyah: cleanKKName,
          namaIbu: cleanIbuName || '-',
          kategoriSasaran: 'Anak/Sekolah',
        });
      }
      currentIdx++;
    }

    return generated;
  };

  const recalculateKKFromMembers = (
    kk: KeluargaDasawisma,
    members: AnggotaKeluargaKK[]
  ): KeluargaDasawisma => {
    const normalizedMembers = members.map((m, i) => ({
      ...m,
      id: m.id || `ak-${kk.id}-${i + 1}`,
    }));

    // Ensure Ibu Hamil status on Istri is synchronized if kk.jumlahIbuHamil > 0
    if ((Number(kk.jumlahIbuHamil) || 0) > 0) {
      const hasBumil = normalizedMembers.some((m) => m.kategoriSasaran === 'Ibu Hamil');
      if (!hasBumil) {
        const istriIdx = normalizedMembers.findIndex(
          (m) => m.statusHubungan?.toUpperCase() === 'ISTRI' || m.jenisKelamin === 'Perempuan'
        );
        if (istriIdx >= 0) {
          normalizedMembers[istriIdx] = {
            ...normalizedMembers[istriIdx],
            kategoriSasaran: 'Ibu Hamil',
          };
        }
      }
    }

    const jumlahAnggotaKeluarga = Math.max(1, normalizedMembers.length);
    const jumlahLakiLaki = normalizedMembers.filter((m) => m.jenisKelamin === 'Laki-laki').length;
    const jumlahPerempuan = normalizedMembers.filter((m) => m.jenisKelamin === 'Perempuan').length;
    const jumlahBalita = normalizedMembers.filter(
      (m) => m.kategoriSasaran === 'Balita' || (typeof m.usia === 'number' && m.usia <= 5)
    ).length;
    const jumlahIbuHamil = normalizedMembers.filter((m) => m.kategoriSasaran === 'Ibu Hamil').length;
    const jumlahLansia = normalizedMembers.filter(
      (m) => m.kategoriSasaran === 'Lansia' || (typeof m.usia === 'number' && m.usia >= 60)
    ).length;

    const kepala = normalizedMembers.find(
      (m) => m.statusHubungan?.toUpperCase() === 'KEPALA KELUARGA'
    );
    const istri = normalizedMembers.find((m) => m.statusHubungan?.toUpperCase() === 'ISTRI');
    const resolvedNoHpIbu = (istri && istri.noHp) || kk.noHpIbu || undefined;

    return {
      ...kk,
      namaKepalaKeluarga: kepala && kepala.nama.trim() ? kepala.nama : kk.namaKepalaKeluarga,
      namaIbu: istri && istri.nama.trim() ? istri.nama : kk.namaIbu,
      noHpIbu: resolvedNoHpIbu,
      jumlahAnggotaKeluarga,
      jumlahLakiLaki,
      jumlahPerempuan,
      jumlahBalita,
      jumlahIbuHamil,
      jumlahLansia,
      anggotaKeluarga: normalizedMembers,
      terakhirDiperbarui: new Date().toISOString().split('T')[0],
    };
  };

  // Auto-ensure existing keluargaList records have anggotaKeluarga & jumlahAnggotaKeluarga 100% synchronized
  useEffect(() => {
    setKeluargaList((prev) => {
      let changed = false;
      const next = prev.map((kk) => {
        const currentMembers = kk.anggotaKeluarga || [];
        const hasGenericPlaceholder = currentMembers.some((m) =>
          isGenericMemberPlaceholder(m.nama)
        );
        const sumLP = (Number(kk.jumlahLakiLaki) || 0) + (Number(kk.jumlahPerempuan) || 0);
        const wasTruncatedToTwo =
          currentMembers.length === 2 && Number(kk.jumlahAnggotaKeluarga) === 2 && sumLP > 2;
        const countMismatch =
          currentMembers.length === 0 ||
          Number(kk.jumlahAnggotaKeluarga) !== currentMembers.length ||
          wasTruncatedToTwo;

        if (hasGenericPlaceholder || countMismatch) {
          changed = true;
          const healedTargetJiwa = wasTruncatedToTwo
            ? sumLP
            : Math.max(Number(kk.jumlahAnggotaKeluarga) || 1, currentMembers.length);

          const kkWithTarget: KeluargaDasawisma = {
            ...kk,
            jumlahAnggotaKeluarga: healedTargetJiwa,
          };

          const matchingAnggota = anggotaList.find(
            (a) =>
              ((a.noKk && kk.noKk && a.noKk.trim() === kk.noKk.trim()) ||
                (a.namaKepalaKeluarga &&
                  kk.namaKepalaKeluarga &&
                  a.namaKepalaKeluarga.trim().toLowerCase() ===
                    kk.namaKepalaKeluarga.trim().toLowerCase())) &&
              a.anggotaKeluarga &&
              a.anggotaKeluarga.length >= healedTargetJiwa &&
              !a.anggotaKeluarga.some((m) => isGenericMemberPlaceholder(m.nama))
          );

          const seeded = matchingAnggota?.anggotaKeluarga
            ? matchingAnggota.anggotaKeluarga
            : ensureMembersForKeluarga(kkWithTarget, kk.id);

          return recalculateKKFromMembers(kkWithTarget, seeded);
        }
        return kk;
      });
      return changed ? next : prev;
    });
  }, [keluargaList.length, anggotaList.length]);

  const addKeluarga = (data: Omit<KeluargaDasawisma, 'id' | 'terakhirDiperbarui'>) => {
    const newId = `kk-${Date.now().toString().slice(-4)}`;
    const members = ensureMembersForKeluarga(data, newId);
    const baseKeluarga: KeluargaDasawisma = {
      ...data,
      id: newId,
      anggotaKeluarga: members,
      jumlahAnggotaKeluarga: members.length,
      terakhirDiperbarui: new Date().toISOString().split('T')[0],
    };
    const syncedKeluarga = recalculateKKFromMembers(baseKeluarga, members);
    setKeluargaList((prev) => [syncedKeluarga, ...prev]);
  };

  const addKeluargaBatch = (
    dataList: Omit<KeluargaDasawisma, 'id' | 'terakhirDiperbarui'>[],
    upsert = true
  ): { added: number; updated: number; nextList: KeluargaDasawisma[] } => {
    let addedCount = 0;
    let updatedCount = 0;
    const today = new Date().toISOString().split('T')[0];
    let finalNextList: KeluargaDasawisma[] = [];

    setKeluargaList((prev) => {
      const existingMap = new Map<string, KeluargaDasawisma>();
      prev.forEach((item) => {
        if (item.noKk) existingMap.set(item.noKk.trim(), item);
      });

      const newItems: KeluargaDasawisma[] = [];
      const updatedMap = new Map<string, KeluargaDasawisma>();

      dataList.forEach((data, index) => {
        const cleanNoKk = data.noKk ? data.noKk.trim() : '';
        if (upsert && cleanNoKk && existingMap.has(cleanNoKk)) {
          const existing = existingMap.get(cleanNoKk)!;
          const mergedData = {
            ...existing,
            ...data,
            anggotaKeluarga:
              data.anggotaKeluarga && data.anggotaKeluarga.length > 0
                ? data.anggotaKeluarga
                : existing.anggotaKeluarga,
          };
          const members = ensureMembersForKeluarga(mergedData, existing.id);
          const synced = recalculateKKFromMembers(
            { ...mergedData, terakhirDiperbarui: today },
            members
          );
          updatedMap.set(existing.id, synced);
          updatedCount++;
        } else {
          const newId = `kk-${Date.now().toString().slice(-4)}-${index + 1}`;
          const members = ensureMembersForKeluarga(data, newId);
          const baseKeluarga: KeluargaDasawisma = {
            ...data,
            id: newId,
            anggotaKeluarga: members,
            terakhirDiperbarui: today,
          };
          const synced = recalculateKKFromMembers(baseKeluarga, members);
          newItems.push(synced);
          if (cleanNoKk) existingMap.set(cleanNoKk, synced);
          addedCount++;
        }
      });

      // Merge updated existing items with unchanged items and prepend new items
      const resultList = prev.map((item) => (updatedMap.has(item.id) ? updatedMap.get(item.id)! : item));
      finalNextList = [...newItems, ...resultList];
      return finalNextList;
    });

    return { added: addedCount, updated: updatedCount, nextList: finalNextList };
  };

  const updateKeluarga = (id: string, data: Partial<KeluargaDasawisma>) => {
    setKeluargaList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged: KeluargaDasawisma = {
          ...item,
          ...data,
          terakhirDiperbarui: new Date().toISOString().split('T')[0],
        };
        const ensuredMembers = ensureMembersForKeluarga(merged, item.id);
        return recalculateKKFromMembers(merged, ensuredMembers);
      })
    );
  };

  const deleteKeluarga = (id: string) => {
    setKeluargaList((prev) => prev.filter((item) => item.id !== id));
  };

  const normalizePersonNameForMatch = (name: string): string => {
    return (name || '')
      .replace(/^(Bpk\.?|Bapak|Ibu|Ny\.?|Nyonya|H\.?|Hj\.?|Drs\.?|Ir\.?|Sdr\.?|Tn\.?)\s+/gi, '')
      .replace(/,\s*[A-Za-z.]+$/g, '')
      .trim()
      .toLowerCase();
  };

  // Computed & Integrated Data Anggota Keluarga Lengkap
  const semuaAnggotaKeluarga: AnggotaKeluargaTerpadu[] = React.useMemo(() => {
    const result: AnggotaKeluargaTerpadu[] = [];
    const seenNiks = new Set<string>();

    // Map from keluargaList
    keluargaList.forEach((kk) => {
      const members =
        kk.anggotaKeluarga && kk.anggotaKeluarga.length > 0
          ? kk.anggotaKeluarga
          : ensureMembersForKeluarga(kk, kk.id);

      members.forEach((m, idx) => {
        const memberId = m.id || `ak-${kk.id}-${idx + 1}`;
        const cleanNik = (m.nik || '').trim();
        const cleanName = (m.nama || '').trim().toLowerCase();
        const normName = normalizePersonNameForMatch(m.nama);

        // Check if this member is registered in anggotaList (Pengurus / Kader PKK)
        const matchedAnggotaPKK = anggotaList.find((a) => {
          const aNik = (a.nik || '').trim();
          if (cleanNik && cleanNik !== '-' && aNik && aNik !== '-' && aNik === cleanNik) {
            return true;
          }
          const aName = (a.nama || '').trim().toLowerCase();
          const aNorm = normalizePersonNameForMatch(a.nama);
          return (cleanName && aName === cleanName) || (normName && aNorm === normName);
        });

        // Check iuran status if any
        const matchedIuran = iuranList.find((ir) => {
          if (matchedAnggotaPKK && ir.anggotaId === matchedAnggotaPKK.id) return true;
          const irName = (ir.namaAnggota || '').trim().toLowerCase();
          const irNorm = normalizePersonNameForMatch(ir.namaAnggota);
          return (cleanName && irName === cleanName) || (normName && irNorm === normName);
        });
        const iuranLunasCount = matchedIuran
          ? (Object.values(matchedIuran.bulan || {}) as IuranBulanStatus[]).filter((b) => b?.lunas).length
          : undefined;

        if (cleanNik && cleanNik !== '-') seenNiks.add(cleanNik);

        // Determine kategoriSasaran automatically if not explicitly set
        let sasaran = m.kategoriSasaran;
        if (!sasaran) {
          if (typeof m.usia === 'number' && m.usia <= 5) sasaran = 'Balita';
          else if (typeof m.usia === 'number' && m.usia >= 60) sasaran = 'Lansia';
          else if (typeof m.usia === 'number' && m.usia >= 6 && m.usia <= 17) sasaran = 'Anak/Sekolah';
          else if (typeof m.usia === 'number' && m.usia >= 18 && m.usia <= 24 && m.statusPernikahan === 'Belum Kawin') sasaran = 'Remaja';
          else if (m.jenisKelamin === 'Perempuan' && m.statusHubungan === 'ISTRI' && kk.statusWUS) sasaran = 'WUS';
          else if (m.statusPernikahan === 'Kawin' && kk.statusPUS) sasaran = 'PUS';
          else sasaran = 'Umum';
        }

        result.push({
          ...m,
          id: memberId,
          keluargaId: kk.id,
          noKk: kk.noKk,
          namaKepalaKeluarga: kk.namaKepalaKeluarga,
          namaIbuKeluarga: kk.namaIbu,
          dasawisma: kk.dasawisma,
          alamat: kk.alamat,
          kategoriSejahtera: kk.kategoriSejahtera,
          statusRumahSehat: kk.statusRumahSehat,
          kategoriSasaran: sasaran,
          noHp: m.noHp || matchedAnggotaPKK?.noHp,
          pendidikan: m.pendidikan || matchedAnggotaPKK?.pendidikanTerakhir || 'SMA / SMK',
          jenisPekerjaan: m.jenisPekerjaan || matchedAnggotaPKK?.pekerjaan || '-',
          tempatLahir: m.tempatLahir || matchedAnggotaPKK?.tempatLahir,
          tanggalLahir: m.tanggalLahir || matchedAnggotaPKK?.tanggalLahir,
          isAnggotaPKK: !!matchedAnggotaPKK,
          anggotaPKKId: matchedAnggotaPKK?.id,
          jabatanPKK: matchedAnggotaPKK?.jabatan,
          pokjaPKK: matchedAnggotaPKK?.pokja,
          statusKeaktifanPKK: matchedAnggotaPKK?.status,
          iuranLunasCount,
        });
      });
    });

    // Only include standalone AnggotaPKK if keluargaList is completely empty
    if (keluargaList.length === 0) {
      anggotaList.forEach((agt) => {
        const cleanNik = (agt.nik || '').trim();
        const normAgt = normalizePersonNameForMatch(agt.nama);
        const alreadyIncluded =
          (cleanNik && cleanNik !== '-' && seenNiks.has(cleanNik)) ||
          result.some((r) => normalizePersonNameForMatch(r.nama) === normAgt);

        if (!alreadyIncluded) {
          const matchedIuran = iuranList.find(
            (ir) =>
              ir.anggotaId === agt.id ||
              normalizePersonNameForMatch(ir.namaAnggota) === normAgt
          );
          const iuranLunasCount = matchedIuran
            ? (Object.values(matchedIuran.bulan || {}) as IuranBulanStatus[]).filter((b) => b?.lunas).length
            : undefined;

          result.push({
            id: `ak-agt-${agt.id}`,
            keluargaId: `virtual-kk-${agt.id}`,
            noKk: agt.noKk || '3201010000000001',
            namaKepalaKeluarga: agt.namaKepalaKeluarga || agt.nama,
            namaIbuKeluarga: agt.nama,
            dasawisma: 'Dasawisma Flamboyan 9',
            alamat: agt.alamat,
            kategoriSejahtera: 'Sejahtera II',
            statusRumahSehat: true,
            nama: agt.nama,
            nik: agt.nik,
            jenisKelamin: 'Perempuan',
            tempatLahir: agt.tempatLahir,
            tanggalLahir: agt.tanggalLahir,
            usia: 35,
            pendidikan: agt.pendidikanTerakhir || 'SMA / SMK',
            jenisPekerjaan: agt.pekerjaan || 'Ibu Rumah Tangga',
            statusPernikahan: 'Kawin',
            statusHubungan: agt.statusKeluarga || 'ISTRI',
            kategoriSasaran: 'WUS',
            noHp: agt.noHp,
            isAnggotaPKK: true,
            anggotaPKKId: agt.id,
            jabatanPKK: agt.jabatan,
            pokjaPKK: agt.pokja,
            statusKeaktifanPKK: agt.status,
            iuranLunasCount,
          });
        }
      });
    }

    return result;
  }, [keluargaList, anggotaList, iuranList]);

  const addAnggotaKeluargaItem = (
    targetKK: {
      keluargaId?: string;
      noKk?: string;
      namaKepalaKeluarga?: string;
      namaIbu?: string;
      dasawisma?: DasawismaName;
      alamat?: string;
      kategoriSejahtera?: 'Pra Sejahtera' | 'Sejahtera I' | 'Sejahtera II' | 'Sejahtera III';
    },
    member: AnggotaKeluargaKK,
    pkkOptions?: {
      registerAsAnggotaPKK: boolean;
      jabatan?: JabatanPKK;
      pokja?: PokjaType;
      noHp?: string;
    }
  ) => {
    const newMemberId = member.id || `ak-${Date.now().toString().slice(-5)}`;
    const memberWithId: AnggotaKeluargaKK = { ...member, id: newMemberId };

    // Check if target KK exists
    const existingKK = keluargaList.find(
      (k) =>
        (targetKK.keluargaId && k.id === targetKK.keluargaId) ||
        (targetKK.noKk && k.noKk.trim() === targetKK.noKk.trim())
    );

    if (existingKK) {
      const currentMembers =
        existingKK.anggotaKeluarga && existingKK.anggotaKeluarga.length > 0
          ? existingKK.anggotaKeluarga
          : ensureMembersForKeluarga(existingKK, existingKK.id);
      const updatedMembers = [...currentMembers, memberWithId];
      setKeluargaList((prev) =>
        prev.map((k) => (k.id === existingKK.id ? recalculateKKFromMembers(k, updatedMembers) : k))
      );
    } else {
      // Create new KK with this member
      const newKkId = `kk-${Date.now().toString().slice(-4)}`;
      const isKepala = member.statusHubungan?.toUpperCase() === 'KEPALA KELUARGA';
      const isIstri = member.statusHubungan?.toUpperCase() === 'ISTRI';
      const newKKBase: KeluargaDasawisma = {
        id: newKkId,
        noKk: targetKK.noKk || '3201010101010001',
        namaKepalaKeluarga: targetKK.namaKepalaKeluarga || (isKepala ? member.nama : `Kel. ${member.nama}`),
        namaIbu: targetKK.namaIbu || (isIstri ? member.nama : '-'),
        alamat: targetKK.alamat || 'Jl. Mawar Indah',
        dasawisma: targetKK.dasawisma || 'Dasawisma Flamboyan 9',
        jumlahAnggotaKeluarga: 1,
        jumlahLakiLaki: member.jenisKelamin === 'Laki-laki' ? 1 : 0,
        jumlahPerempuan: member.jenisKelamin === 'Perempuan' ? 1 : 0,
        jumlahBalita: member.kategoriSasaran === 'Balita' || (member.usia !== undefined && member.usia <= 5) ? 1 : 0,
        jumlahIbuHamil: member.kategoriSasaran === 'Ibu Hamil' ? 1 : 0,
        jumlahLansia: member.kategoriSasaran === 'Lansia' || (member.usia !== undefined && member.usia >= 60) ? 1 : 0,
        statusPUS: true,
        statusWUS: member.jenisKelamin === 'Perempuan',
        statusRumahSehat: true,
        memilikiJambanSehat: true,
        memilikiSPAL: true,
        memilikiTempatSampah: true,
        memilikiSumberAirBersih: true,
        memilikiPekaranganToga: true,
        makananPokok: 'Beras',
        kategoriSejahtera: targetKK.kategoriSejahtera || 'Sejahtera II',
        anggotaKeluarga: [memberWithId],
        terakhirDiperbarui: new Date().toISOString().split('T')[0],
      };
      setKeluargaList((prev) => [recalculateKKFromMembers(newKKBase, [memberWithId]), ...prev]);
    }

    if (pkkOptions?.registerAsAnggotaPKK) {
      const alreadyInAnggota = anggotaList.some(
        (a) =>
          (member.nik && a.nik.trim() === member.nik.trim()) ||
          a.nama.trim().toLowerCase() === member.nama.trim().toLowerCase()
      );
      if (!alreadyInAnggota) {
        addAnggota({
          nik: member.nik || '3201010000000001',
          nama: member.nama,
          noHp: pkkOptions.noHp || member.noHp || '081200000000',
          alamat: targetKK.alamat || existingKK?.alamat || 'Jl. Mawar Indah',
          rt: profil.namaRT.replace('RT ', ''),
          rw: profil.namaRW.replace('RW ', ''),
          jabatan: pkkOptions.jabatan || 'Anggota Pokja',
          pokja: pkkOptions.pokja || 'Pokja I',
          status: 'Aktif',
          tanggalBergabung: new Date().toISOString().split('T')[0],
          tempatLahir: member.tempatLahir || '',
          tanggalLahir: member.tanggalLahir || '',
          pekerjaan: member.jenisPekerjaan || 'Ibu Rumah Tangga',
          pendidikanTerakhir: member.pendidikan || 'SMA / SMK',
          noKk: targetKK.noKk || existingKK?.noKk || '',
          namaKepalaKeluarga: targetKK.namaKepalaKeluarga || existingKK?.namaKepalaKeluarga || '',
          statusKeluarga: member.statusHubungan,
          catatan: `Terintegrasi dari Daftar Anggota Keluarga (${targetKK.dasawisma || existingKK?.dasawisma || 'Dasawisma'})`,
        });
      }
    }
  };

  const updateAnggotaKeluargaItem = (
    keluargaId: string,
    memberId: string,
    updatedMember: AnggotaKeluargaKK
  ) => {
    // Handle virtual KK from standalone anggotaList if edited before sync
    if (keluargaId.startsWith('virtual-kk-')) {
      const agtId = keluargaId.replace('virtual-kk-', '');
      const agt = anggotaList.find((a) => a.id === agtId);
      if (agt) {
        updateAnggota(agtId, {
          nama: updatedMember.nama,
          nik: updatedMember.nik,
          tempatLahir: updatedMember.tempatLahir,
          tanggalLahir: updatedMember.tanggalLahir,
          pendidikanTerakhir: updatedMember.pendidikan,
          pekerjaan: updatedMember.jenisPekerjaan,
          statusKeluarga: updatedMember.statusHubungan,
          noHp: updatedMember.noHp || agt.noHp,
        });
      }
      return;
    }

    let oldMemberRef: AnggotaKeluargaKK | undefined;

    setKeluargaList((prev) =>
      prev.map((kk) => {
        if (kk.id !== keluargaId) return kk;
        const currentMembers =
          kk.anggotaKeluarga && kk.anggotaKeluarga.length > 0
            ? kk.anggotaKeluarga
            : ensureMembersForKeluarga(kk, kk.id);

        const updatedList = currentMembers.map((m, idx) => {
          const mId = m.id || `ak-${kk.id}-${idx + 1}`;
          if (mId === memberId || (m.nik && m.nik === memberId)) {
            oldMemberRef = m;
            return { ...m, ...updatedMember, id: mId };
          }
          return m;
        });

        return recalculateKKFromMembers(kk, updatedList);
      })
    );

    // Sync to anggotaList & iuranList if this member is also an Anggota PKK
    setAnggotaList((prev) =>
      prev.map((a) => {
        const matchByNik =
          (updatedMember.nik && a.nik === updatedMember.nik) ||
          (oldMemberRef?.nik && a.nik === oldMemberRef.nik);
        const matchByName =
          oldMemberRef && a.nama.trim().toLowerCase() === oldMemberRef.nama.trim().toLowerCase();

        if (matchByNik || matchByName) {
          return {
            ...a,
            nama: updatedMember.nama,
            nik: updatedMember.nik || a.nik,
            tempatLahir: updatedMember.tempatLahir ?? a.tempatLahir,
            tanggalLahir: updatedMember.tanggalLahir ?? a.tanggalLahir,
            pendidikanTerakhir: updatedMember.pendidikan ?? a.pendidikanTerakhir,
            pekerjaan: updatedMember.jenisPekerjaan ?? a.pekerjaan,
            statusKeluarga: updatedMember.statusHubungan ?? a.statusKeluarga,
            noHp: updatedMember.noHp || a.noHp,
          };
        }
        return a;
      })
    );
  };

  const deleteAnggotaKeluargaItem = (keluargaId: string, memberId: string) => {
    setKeluargaList((prev) =>
      prev.map((kk) => {
        if (kk.id !== keluargaId) return kk;
        const currentMembers =
          kk.anggotaKeluarga && kk.anggotaKeluarga.length > 0
            ? kk.anggotaKeluarga
            : ensureMembersForKeluarga(kk, kk.id);
        const filtered = currentMembers.filter((m, idx) => {
          const mId = m.id || `ak-${kk.id}-${idx + 1}`;
          return mId !== memberId && m.nik !== memberId;
        });
        return recalculateKKFromMembers(kk, filtered);
      })
    );
  };

  const promoteAnggotaKeluargaToPKK = (
    member: AnggotaKeluargaTerpadu,
    jabatan: JabatanPKK,
    pokja: PokjaType,
    noHp: string
  ) => {
    const exists = anggotaList.some(
      (a) =>
        (member.nik && a.nik.trim() === member.nik.trim()) ||
        a.nama.trim().toLowerCase() === member.nama.trim().toLowerCase()
    );
    if (exists) return;

    addAnggota({
      nik: member.nik || '3201010000000001',
      nama: member.nama,
      noHp: noHp || member.noHp || '081200000000',
      alamat: member.alamat,
      rt: profil.namaRT.replace('RT ', ''),
      rw: profil.namaRW.replace('RW ', ''),
      jabatan,
      pokja,
      status: 'Aktif',
      tanggalBergabung: new Date().toISOString().split('T')[0],
      tempatLahir: member.tempatLahir || '',
      tanggalLahir: member.tanggalLahir || '',
      pekerjaan: member.jenisPekerjaan || 'Ibu Rumah Tangga',
      pendidikanTerakhir: member.pendidikan || 'SMA / SMK',
      noKk: member.noKk,
      namaKepalaKeluarga: member.namaKepalaKeluarga,
      statusKeluarga: member.statusHubungan,
      catatan: `Terintegrasi dari Data Keluarga (${member.dasawisma})`,
    });
  };

  const syncSemuaDataKeluargaDanAnggota = (): { syncedKK: number; syncedMembers: number } => {
    let syncedKK = 0;
    let syncedMembers = 0;

    setKeluargaList((prevKK) => {
      const updatedKKList = prevKK.map((kk) => {
        const members =
          kk.anggotaKeluarga && kk.anggotaKeluarga.length > 0
            ? kk.anggotaKeluarga
            : ensureMembersForKeluarga(kk, kk.id);
        syncedMembers += members.length;
        return recalculateKKFromMembers(kk, members);
      });

      // Check if any anggotaList member is missing from keluargaList
      anggotaList.forEach((agt) => {
        const existingKKIdx = updatedKKList.findIndex(
          (k) =>
            (agt.noKk && k.noKk.trim() === agt.noKk.trim()) ||
            k.namaIbu.trim().toLowerCase() === agt.nama.trim().toLowerCase() ||
            k.namaKepalaKeluarga.trim().toLowerCase() === agt.nama.trim().toLowerCase()
        );

        if (existingKKIdx >= 0) {
          const targetKK = updatedKKList[existingKKIdx];
          const currentMembers = targetKK.anggotaKeluarga || [];
          const hasMember = currentMembers.some(
            (m) =>
              (agt.nik && m.nik.trim() === agt.nik.trim()) ||
              m.nama.trim().toLowerCase() === agt.nama.trim().toLowerCase()
          );
          if (!hasMember) {
            const newMem: AnggotaKeluargaKK = {
              id: `ak-${targetKK.id}-${currentMembers.length + 1}`,
              nama: agt.nama,
              nik: agt.nik,
              jenisKelamin: 'Perempuan',
              tempatLahir: agt.tempatLahir,
              tanggalLahir: agt.tanggalLahir,
              usia: 35,
              pendidikan: agt.pendidikanTerakhir || 'SMA / SMK',
              jenisPekerjaan: agt.pekerjaan || 'Ibu Rumah Tangga',
              statusPernikahan: 'Kawin',
              statusHubungan: agt.statusKeluarga || 'ISTRI',
              noHp: agt.noHp,
              kategoriSasaran: 'WUS',
            };
            const nextMembers = [...currentMembers, newMem];
            updatedKKList[existingKKIdx] = recalculateKKFromMembers(targetKK, nextMembers);
            syncedMembers++;
          }
        } else {
          // Create new KK for this Anggota PKK
          const newId = `kk-sync-${agt.id}`;
          const baseMembers: AnggotaKeluargaKK[] =
            agt.anggotaKeluarga && agt.anggotaKeluarga.length > 0
              ? agt.anggotaKeluarga
              : [
                  {
                    id: `ak-${newId}-1`,
                    nama: agt.namaKepalaKeluarga || `Bpk. Kel. ${agt.nama}`,
                    nik: `${(agt.noKk || agt.nik || '320101000000').slice(0, 12)}0001`,
                    jenisKelamin: 'Laki-laki',
                    usia: 40,
                    pendidikan: 'SMA / SMK',
                    jenisPekerjaan: 'Karyawan / Wiraswasta',
                    statusPernikahan: 'Kawin',
                    statusHubungan: 'KEPALA KELUARGA',
                    kategoriSasaran: 'PUS',
                  },
                  {
                    id: `ak-${newId}-2`,
                    nama: agt.nama,
                    nik: agt.nik,
                    jenisKelamin: 'Perempuan',
                    tempatLahir: agt.tempatLahir,
                    tanggalLahir: agt.tanggalLahir,
                    usia: 36,
                    pendidikan: agt.pendidikanTerakhir || 'SMA / SMK',
                    jenisPekerjaan: agt.pekerjaan || 'Ibu Rumah Tangga',
                    statusPernikahan: 'Kawin',
                    statusHubungan: agt.statusKeluarga || 'ISTRI',
                    noHp: agt.noHp,
                    kategoriSasaran: 'WUS',
                  },
                ];

          const newKK: KeluargaDasawisma = {
            id: newId,
            noKk: agt.noKk || `${(agt.nik || '320101010101').slice(0, 12)}0001`,
            namaKepalaKeluarga: agt.namaKepalaKeluarga || `Bpk. Kel. ${agt.nama}`,
            namaIbu: agt.nama,
            alamat: agt.alamat,
            dasawisma: 'Dasawisma Flamboyan 9',
            jumlahAnggotaKeluarga: baseMembers.length,
            jumlahLakiLaki: baseMembers.filter((m) => m.jenisKelamin === 'Laki-laki').length,
            jumlahPerempuan: baseMembers.filter((m) => m.jenisKelamin === 'Perempuan').length,
            jumlahBalita: 0,
            jumlahIbuHamil: 0,
            jumlahLansia: 0,
            statusPUS: true,
            statusWUS: true,
            statusRumahSehat: true,
            memilikiJambanSehat: true,
            memilikiSPAL: true,
            memilikiTempatSampah: true,
            memilikiSumberAirBersih: true,
            memilikiPekaranganToga: true,
            makananPokok: 'Beras',
            kategoriSejahtera: 'Sejahtera II',
            anggotaKeluarga: baseMembers,
            catatanKesehatan: `Terintegrasi otomatis dari Buku I Anggota PKK (${agt.jabatan})`,
            terakhirDiperbarui: new Date().toISOString().split('T')[0],
          };
          updatedKKList.push(recalculateKKFromMembers(newKK, baseMembers));
          syncedKK++;
          syncedMembers += baseMembers.length;
        }
      });

      return updatedKKList;
    });

    // Also sync to iuran
    syncIuranFromAnggotaDanDasawisma();

    return { syncedKK, syncedMembers };
  };

  // Kegiatan Actions
  const addKegiatan = (data: Omit<KegiatanPKK, 'id'>) => {
    const newKegiatan: KegiatanPKK = {
      ...data,
      id: `kgt-${Date.now().toString().slice(-4)}`,
    };
    setKegiatanList((prev) => [newKegiatan, ...prev]);
  };

  const updateKegiatan = (id: string, data: Partial<KegiatanPKK>) => {
    setKegiatanList((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const deleteKegiatan = (id: string) => {
    setKegiatanList((prev) => prev.filter((item) => item.id !== id));
  };

  // TOGA Actions
  const addToga = (data: Omit<TanamanToga, 'id'>) => {
    const newToga: TanamanToga = {
      ...data,
      id: `toga-${Date.now().toString().slice(-4)}`,
    };
    setTogaList((prev) => [newToga, ...prev]);
  };

  const updateToga = (id: string, data: Partial<TanamanToga>) => {
    setTogaList((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const deleteToga = (id: string) => {
    setTogaList((prev) => prev.filter((item) => item.id !== id));
  };

  const catatPanenToga = (id: string, hasilKg: number) => {
    setTogaList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              statusPanen: 'Telah Dipanen',
              hasilPanenKg: (item.hasilPanenKg || 0) + hasilKg,
              catatan: `${item.catatan ? item.catatan + '. ' : ''}Panen ${hasilKg} kg pada ${new Date().toLocaleDateString('id-ID')}`,
            }
          : item
      )
    );
  };

  // Transaksi Kas Actions
  const addTransaksi = (data: Omit<TransaksiKas, 'id'>) => {
    const newTx: TransaksiKas = {
      ...data,
      id: `kas-${Date.now().toString().slice(-4)}`,
    };
    setTransaksiList((prev) => [newTx, ...prev]);
  };

  const updateTransaksi = (id: string, data: Partial<TransaksiKas>) => {
    setTransaksiList((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const deleteTransaksi = (id: string) => {
    setTransaksiList((prev) => prev.filter((item) => item.id !== id));
  };

  // Iuran Actions
  const toggleIuranBulan = (anggotaId: string, bulan: number) => {
    setIuranList((prev) =>
      prev.map((rec) => {
        if (rec.anggotaId !== anggotaId) return rec;
        const currentStatus = rec.bulan[bulan] || { lunas: false, nominal: profil.iuranBulananNominal };
        const newLunas = !currentStatus.lunas;
        const nominalBayar = currentStatus.nominal || profil.iuranBulananNominal;

        // If paying, record a transaction automatically
        if (newLunas) {
          addTransaksi({
            tanggal: new Date().toISOString().split('T')[0],
            jenis: 'Masuk',
            kategori: 'Iuran Rutin Anggota',
            jumlah: nominalBayar,
            keterangan: `Iuran Bulan ${bulan}/${rec.tahun || new Date().getFullYear()} - ${rec.namaAnggota}`,
            penanggungJawab: profil.namaBendahara || 'Bendahara',
            noBukti: `IUR-${bulan}-${rec.anggotaId.slice(-3)}`,
          });
        }

        return {
          ...rec,
          bulan: {
            ...rec.bulan,
            [bulan]: {
              ...currentStatus,
              lunas: newLunas,
              nominal: nominalBayar,
              tanggalBayar: newLunas ? new Date().toISOString().split('T')[0] : undefined,
            },
          },
        };
      })
    );
  };

  const addPesertaIuran = (data: {
    namaAnggota: string;
    jabatan: string;
    dasawisma?: string;
    noHp?: string;
    tahun?: number;
    syncToAnggota?: boolean;
  }): string => {
    const newId = `agt-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`;
    const defaultBulan: { [k: number]: IuranBulanStatus } = {};
    for (let m = 1; m <= 12; m++) {
      defaultBulan[m] = { lunas: false, nominal: profil.iuranBulananNominal };
    }

    const newRec: RekapIuranAnggota = {
      anggotaId: newId,
      namaAnggota: data.namaAnggota.trim(),
      jabatan: data.jabatan || 'Anggota Pokja',
      dasawisma: data.dasawisma || 'Dasawisma Flamboyan 9',
      noHp: data.noHp || '',
      tahun: data.tahun || new Date().getFullYear(),
      bulan: defaultBulan,
    };

    setIuranList((prev) => [...prev, newRec]);

    if (data.syncToAnggota !== false) {
      setAnggotaList((prev) => {
        const exists = prev.some(
          (a) => a.nama.trim().toLowerCase() === data.namaAnggota.trim().toLowerCase()
        );
        if (exists) return prev;
        const newMember: AnggotaPKK = {
          id: newId,
          nik: '-',
          nama: data.namaAnggota.trim(),
          noHp: data.noHp || '-',
          alamat: `${profil.namaRT} / ${profil.namaRW}`,
          rt: profil.namaRT.replace('RT ', ''),
          rw: profil.namaRW.replace('RW ', ''),
          jabatan: (data.jabatan as any) || 'Anggota Pokja',
          pokja: 'Pokja I',
          status: 'Aktif',
          tanggalBergabung: new Date().toISOString().split('T')[0],
          catatan: data.dasawisma ? `Kelompok ${data.dasawisma}` : '',
        };
        return [newMember, ...prev];
      });
    }

    return newId;
  };

  const inputIuranAnggota = (params: {
    anggotaId: string;
    bulanList: number[];
    nominalPerBulan: number;
    tanggalBayar: string;
    metodeBayar?: 'Tunai' | 'Transfer';
    catatan?: string;
    catatKeKas?: boolean;
  }) => {
    const {
      anggotaId,
      bulanList,
      nominalPerBulan,
      tanggalBayar,
      metodeBayar = 'Tunai',
      catatan = '',
      catatKeKas = true,
    } = params;

    if (!bulanList.length) return;

    const bulanNamaPendek = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des',
    ];

    setIuranList((prev) =>
      prev.map((rec) => {
        if (rec.anggotaId !== anggotaId) return rec;

        const updatedBulan = { ...rec.bulan };
        const newlyPaidMonths: number[] = [];

        bulanList.forEach((m) => {
          if (m >= 1 && m <= 12) {
            newlyPaidMonths.push(m);
            updatedBulan[m] = {
              lunas: true,
              nominal: nominalPerBulan,
              tanggalBayar,
              metodeBayar,
              catatan,
            };
          }
        });

        if (catatKeKas && newlyPaidMonths.length > 0) {
          const totalBayar = newlyPaidMonths.length * nominalPerBulan;
          const labelBulan = newlyPaidMonths
            .sort((a, b) => a - b)
            .map((m) => bulanNamaPendek[m - 1])
            .join(', ');
          addTransaksi({
            tanggal: tanggalBayar || new Date().toISOString().split('T')[0],
            jenis: 'Masuk',
            kategori: 'Iuran Rutin Anggota',
            jumlah: totalBayar,
            keterangan: `Setoran Iuran (${labelBulan} ${rec.tahun || new Date().getFullYear()}) - ${rec.namaAnggota}${catatan ? ` [${catatan}]` : ''}`,
            penanggungJawab: profil.namaBendahara || 'Bendahara',
            noBukti: `IUR-${newlyPaidMonths.join('')}-${rec.anggotaId.slice(-3)}`,
          });
        }

        return {
          ...rec,
          bulan: updatedBulan,
        };
      })
    );
  };

  const updatePesertaIuran = (
    anggotaId: string,
    data: {
      namaAnggota?: string;
      jabatan?: string;
      dasawisma?: string;
      noHp?: string;
      bulan?: { [k: number]: IuranBulanStatus };
    }
  ) => {
    let savedTargetName = '';
    setIuranList((prev) =>
      prev.map((rec) => {
        if (rec.anggotaId !== anggotaId) return rec;
        const newName = data.namaAnggota !== undefined ? data.namaAnggota : rec.namaAnggota;
        savedTargetName = newName;
        return {
          ...rec,
          namaAnggota: newName,
          jabatan: data.jabatan !== undefined ? data.jabatan : rec.jabatan,
          dasawisma: data.dasawisma !== undefined ? data.dasawisma : rec.dasawisma,
          noHp: data.noHp !== undefined ? data.noHp : rec.noHp,
          bulan: data.bulan !== undefined ? data.bulan : rec.bulan,
        };
      })
    );

    // Cross-sync noHp and nama to anggotaList and keluargaList if updated
    if (data.noHp !== undefined || data.namaAnggota !== undefined) {
      const cleanPhone = data.noHp !== undefined ? data.noHp.trim() : undefined;
      const cleanNameLower = savedTargetName.trim().toLowerCase();

      // 1. Sync to anggotaList
      setAnggotaList((prevA) =>
        prevA.map((a) => {
          const matchId = a.id === anggotaId;
          const matchName = a.nama.trim().toLowerCase() === cleanNameLower;
          if (matchId || matchName) {
            return {
              ...a,
              ...(cleanPhone !== undefined ? { noHp: cleanPhone } : {}),
              ...(data.namaAnggota !== undefined ? { nama: data.namaAnggota } : {}),
            };
          }
          return a;
        })
      );

      // 2. Sync to keluargaList (Ibu / Anggota)
      setKeluargaList((prevK) =>
        prevK.map((k) => {
          const isMatchKK = `iur-kk-${k.id}` === anggotaId;
          const isMatchIbu = k.namaIbu && k.namaIbu.trim().toLowerCase() === cleanNameLower;
          if (isMatchKK || isMatchIbu) {
            const updatedMembers = (k.anggotaKeluarga || []).map((m) => {
              if (m.statusHubungan?.toUpperCase() === 'ISTRI') {
                return {
                  ...m,
                  ...(cleanPhone !== undefined ? { noHp: cleanPhone } : {}),
                  ...(data.namaAnggota !== undefined ? { nama: data.namaAnggota } : {}),
                };
              }
              return m;
            });
            return {
              ...k,
              ...(cleanPhone !== undefined ? { noHpIbu: cleanPhone } : {}),
              ...(data.namaAnggota !== undefined ? { namaIbu: data.namaAnggota } : {}),
              anggotaKeluarga: updatedMembers,
            };
          }
          return k;
        })
      );
    }
  };

  const deletePesertaIuran = (anggotaId: string) => {
    setIuranList((prev) => prev.filter((rec) => rec.anggotaId !== anggotaId));
  };

  const syncIuranFromAnggotaDanDasawisma = (): { addedCount: number } => {
    let addedCount = 0;
    const defaultBulan: { [k: number]: IuranBulanStatus } = {};
    for (let m = 1; m <= 12; m++) {
      defaultBulan[m] = { lunas: false, nominal: profil.iuranBulananNominal };
    }

    setIuranList((prev) => {
      const existingNames = new Set(prev.map((i) => i.namaAnggota.trim().toLowerCase()));
      const newEntries: RekapIuranAnggota[] = [];

      // 1. From anggotaList
      anggotaList.forEach((a) => {
        const key = a.nama.trim().toLowerCase();
        if (key && !existingNames.has(key)) {
          existingNames.add(key);
          newEntries.push({
            anggotaId: a.id,
            namaAnggota: a.nama,
            jabatan: a.jabatan,
            noHp: a.noHp,
            tahun: new Date().getFullYear(),
            bulan: { ...defaultBulan },
          });
          addedCount++;
        }
      });

      // 2. From keluargaList (Ibu / Kepala Keluarga)
      keluargaList.forEach((kk) => {
        const targetName = (kk.namaIbu && kk.namaIbu !== '-' ? kk.namaIbu : kk.namaKepalaKeluarga).trim();
        const key = targetName.toLowerCase();
        const istriMember = (kk.anggotaKeluarga || []).find((m) => m.statusHubungan?.toUpperCase() === 'ISTRI');
        const phone = kk.noHpIbu || istriMember?.noHp || '';

        if (key && !existingNames.has(key)) {
          existingNames.add(key);
          newEntries.push({
            anggotaId: `iur-kk-${kk.id}`,
            namaAnggota: targetName,
            jabatan: 'Warga / Dasawisma',
            dasawisma: kk.dasawisma,
            noHp: phone,
            tahun: new Date().getFullYear(),
            bulan: { ...defaultBulan },
          });
          addedCount++;
        }
      });

      // Also backfill missing noHp for existing entries if matching record has a phone
      const backfilled = prev.map((rec) => {
        if (!rec.noHp || rec.noHp === '-') {
          const matchAgt = anggotaList.find(
            (a) => a.id === rec.anggotaId || a.nama.trim().toLowerCase() === rec.namaAnggota.trim().toLowerCase()
          );
          if (matchAgt && matchAgt.noHp && matchAgt.noHp !== '-') {
            return { ...rec, noHp: matchAgt.noHp };
          }
          const matchKK = keluargaList.find(
            (k) =>
              `iur-kk-${k.id}` === rec.anggotaId ||
              (k.namaIbu && k.namaIbu.trim().toLowerCase() === rec.namaAnggota.trim().toLowerCase())
          );
          const kkPhone = matchKK?.noHpIbu || matchKK?.anggotaKeluarga?.find((m) => m.statusHubungan === 'ISTRI')?.noHp;
          if (kkPhone && kkPhone !== '-') {
            return { ...rec, noHp: kkPhone };
          }
        }
        return rec;
      });

      return [...backfilled, ...newEntries];
    });

    return { addedCount };
  };

  // Surat Actions
  const addSurat = (data: Omit<SuratDinasPKK, 'id' | 'dibuatTanggal'>) => {
    const newSurat: SuratDinasPKK = {
      ...data,
      id: `srt-${Date.now().toString().slice(-4)}`,
      dibuatTanggal: new Date().toISOString().split('T')[0],
    };
    setSuratList((prev) => [newSurat, ...prev]);
  };

  const updateSurat = (id: string, data: Partial<SuratDinasPKK>) => {
    setSuratList((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const deleteSurat = (id: string) => {
    setSuratList((prev) => prev.filter((item) => item.id !== id));
  };

  // Computed Analytics
  const totalKasMasuk = transaksiList
    .filter((t) => t.jenis === 'Masuk')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const totalKasKeluar = transaksiList
    .filter((t) => t.jenis === 'Keluar')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const saldoKas = totalKasMasuk - totalKasKeluar;

  const totalJiwaDasawisma = semuaAnggotaKeluarga.length;
  const totalLakiLaki = semuaAnggotaKeluarga.filter((m) => m.jenisKelamin === 'Laki-laki').length;
  const totalPerempuan = semuaAnggotaKeluarga.filter((m) => m.jenisKelamin === 'Perempuan').length;
  const totalBalita = semuaAnggotaKeluarga.filter(
    (m) => m.kategoriSasaran === 'Balita' || (typeof m.usia === 'number' && m.usia <= 5)
  ).length;
  const totalIbuHamil = semuaAnggotaKeluarga.filter((m) => m.kategoriSasaran === 'Ibu Hamil').length;
  const totalLansia = semuaAnggotaKeluarga.filter(
    (m) => m.kategoriSasaran === 'Lansia' || (typeof m.usia === 'number' && m.usia >= 60)
  ).length;

  const totalRumahSehat = keluargaList.filter((k) => k.statusRumahSehat).length;
  const persentaseRumahSehat =
    keluargaList.length > 0 ? Math.round((totalRumahSehat / keluargaList.length) * 100) : 0;

  const totalPolybagToga = togaList.reduce((acc, t) => acc + t.jumlahPolybag, 0);
  const togaSiapPanenCount = togaList.filter((t) => t.statusPanen === 'Siap Panen').length;

  // Real Notifications Engine (dynamic based on actual data)
  const notifications: NotificationItem[] = [];
  if (kegiatanList.some((k) => k.status === 'Akan Datang')) {
    const nextKgt = kegiatanList.find((k) => k.status === 'Akan Datang');
    if (nextKgt) {
      notifications.push({
        id: 'notif-kgt',
        type: 'info',
        title: 'Agenda Kegiatan Mendatang',
        message: `${nextKgt.namaKegiatan} dijadwalkan pada ${nextKgt.tanggal}.`,
        timestamp: 'Terkini',
        linkView: 'kegiatan',
      });
    }
  }
  if (togaSiapPanenCount > 0) {
    notifications.push({
      id: 'notif-toga',
      type: 'success',
      title: 'Tanaman TOGA Siap Panen',
      message: `Terdapat ${togaSiapPanenCount} varietas TOGA yang siap dipanen.`,
      timestamp: 'Terkini',
      linkView: 'toga',
    });
  }
  if (keluargaList.length > 0 && persentaseRumahSehat < 100) {
    const belumSehat = keluargaList.filter((k) => !k.statusRumahSehat).length;
    notifications.push({
      id: 'notif-dsw',
      type: 'warning',
      title: 'Pemantauan Sanitasi Dasawisma',
      message: `Terdapat ${belumSehat} keluarga yang memerlukan pendampingan sanitasi & rumah sehat.`,
      timestamp: 'Terkini',
      linkView: 'dasawisma',
    });
  }

  const dismissNotification = (_id: string) => {
    // Dismiss handling
  };

  // Clear all data to empty state
  const clearAllData = () => {
    setProfil(initialProfilPKK);
    setAnggotaList([]);
    setKeluargaList([]);
    setKegiatanList([]);
    setTogaList([]);
    setTransaksiList([]);
    setIuranList([]);
    setSuratList([]);
    localStorage.removeItem(STORAGE_KEYS.PROFIL);
    localStorage.removeItem(STORAGE_KEYS.ANGGOTA);
    localStorage.removeItem(STORAGE_KEYS.KELUARGA);
    localStorage.removeItem(STORAGE_KEYS.KEGIATAN);
    localStorage.removeItem(STORAGE_KEYS.TOGA);
    localStorage.removeItem(STORAGE_KEYS.TRANSAKSI);
    localStorage.removeItem(STORAGE_KEYS.IURAN);
    localStorage.removeItem(STORAGE_KEYS.SURAT);
  };

  // Reset & Backup Operations
  const resetToDefaultData = () => {
    clearAllData();
  };

  const exportDataJSON = () => {
    const fullBackup = {
      profil,
      anggotaList,
      keluargaList,
      kegiatanList,
      togaList,
      transaksiList,
      iuranList,
      suratList,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `e-PKK_Backup_${profil.namaRT}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profil) setProfil(parsed.profil);
      if (Array.isArray(parsed.anggotaList)) setAnggotaList(parsed.anggotaList);
      if (Array.isArray(parsed.keluargaList)) setKeluargaList(parsed.keluargaList);
      if (Array.isArray(parsed.kegiatanList)) setKegiatanList(parsed.kegiatanList);
      if (Array.isArray(parsed.togaList)) setTogaList(parsed.togaList);
      if (Array.isArray(parsed.transaksiList)) setTransaksiList(parsed.transaksiList);
      if (Array.isArray(parsed.iuranList)) setIuranList(parsed.iuranList);
      if (Array.isArray(parsed.suratList)) setSuratList(parsed.suratList);
      if (Array.isArray(parsed.userAccounts)) {
        setUserAccounts(parsed.userAccounts);
        localStorage.setItem(STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(parsed.userAccounts));
      }

      if (cloudSyncStatus.isOnline) {
        pushAllDataToCloud({
          profil: parsed.profil || profil,
          anggotaList: parsed.anggotaList || anggotaList,
          keluargaList: parsed.keluargaList || keluargaList,
          kegiatanList: parsed.kegiatanList || kegiatanList,
          togaList: parsed.togaList || togaList,
          transaksiList: parsed.transaksiList || transaksiList,
          iuranList: parsed.iuranList || iuranList,
          suratList: parsed.suratList || suratList,
        }).catch((err) => console.warn('Cloud sync after JSON import caught:', err));
      }

      return true;
    } catch (e) {
      console.error('Failed to import JSON', e);
      return false;
    }
  };

  // Auth Operations
  const login = (
    usernameInput: string,
    passwordInput: string,
    remember: boolean = true
  ): { success: boolean; message?: string } => {
    const user = userAccounts.find(
      (u) => u.username.toLowerCase().trim() === usernameInput.toLowerCase().trim()
    );

    if (!user) {
      return { success: false, message: 'Username tidak ditemukan. Periksa kembali nama pengguna Anda.' };
    }

    if (user.password !== passwordInput) {
      return { success: false, message: 'Kata sandi tidak sesuai. Silakan periksa kembali.' };
    }

    let displayName = user.namaDefault;
    if (user.role === 'Ketua TP PKK' && profil.namaKetua) displayName = profil.namaKetua;
    else if (user.role === 'Sekretaris' && profil.namaSekretaris) displayName = profil.namaSekretaris;
    else if (user.role === 'Bendahara' && profil.namaBendahara) displayName = profil.namaBendahara;

    const session: AuthSession = {
      username: user.username,
      role: user.role,
      displayName,
      loginAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setCurrentUser(session);
    setUserRoleState(user.role);
    localStorage.setItem(STORAGE_KEYS.ROLE, user.role);

    if (remember) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    } else if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    }

    // Update lastLogin on user account
    setUserAccounts((prev) => {
      const updated = prev.map((u) =>
        u.username.toLowerCase() === user.username.toLowerCase()
          ? {
              ...u,
              lastLogin: new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
            }
          : u
      );
      localStorage.setItem(STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(updated));
      return updated;
    });

    return { success: true };
  };

  const quickLogin = (username: string): boolean => {
    const user = userAccounts.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      const res = login(user.username, user.password, true);
      return res.success;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  };

  const changePassword = (
    username: string,
    oldPassword: string,
    newPassword: string
  ): { success: boolean; message?: string } => {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'Kata sandi baru minimal 4 karakter.' };
    }

    const user = userAccounts.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    if (user.password !== oldPassword) {
      return { success: false, message: 'Kata sandi lama tidak cocok.' };
    }

    setUserAccounts((prev) => {
      const updated = prev.map((u) =>
        u.username.toLowerCase() === username.toLowerCase()
          ? {
              ...u,
              password: newPassword,
              lastPasswordChange: new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
            }
          : u
      );
      localStorage.setItem(STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(updated));
      return updated;
    });

    return { success: true };
  };

  const resetPasswordToDefault = (username: string): boolean => {
    const defaultAcc = initialUserAccounts.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!defaultAcc) return false;

    setUserAccounts((prev) => {
      const updated = prev.map((u) =>
        u.username.toLowerCase() === username.toLowerCase()
          ? {
              ...u,
              password: defaultAcc.password,
              lastPasswordChange: new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
            }
          : u
      );
      localStorage.setItem(STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(updated));
      return updated;
    });
    return true;
  };

  return (
    <PKKContext.Provider
      value={{
        currentView,
        setCurrentView,
        userRole,
        setUserRole,
        isDarkMode,
        toggleDarkMode,
        searchGlobal,
        setSearchGlobal,

        profil,
        updateProfil,

        anggotaList,
        addAnggota,
        updateAnggota,
        deleteAnggota,

        keluargaList,
        addKeluarga,
        addKeluargaBatch,
        updateKeluarga,
        deleteKeluarga,

        semuaAnggotaKeluarga,
        selectedKeluargaFilterId,
        setSelectedKeluargaFilterId,
        addAnggotaKeluargaItem,
        updateAnggotaKeluargaItem,
        deleteAnggotaKeluargaItem,
        promoteAnggotaKeluargaToPKK,
        syncSemuaDataKeluargaDanAnggota,

        kegiatanList,
        addKegiatan,
        updateKegiatan,
        deleteKegiatan,

        togaList,
        addToga,
        updateToga,
        deleteToga,
        catatPanenToga,

        transaksiList,
        addTransaksi,
        updateTransaksi,
        deleteTransaksi,

        iuranList,
        toggleIuranBulan,
        inputIuranAnggota,
        addPesertaIuran,
        updatePesertaIuran,
        deletePesertaIuran,
        syncIuranFromAnggotaDanDasawisma,

        suratList,
        addSurat,
        updateSurat,
        deleteSurat,

        saldoKas,
        totalKasMasuk,
        totalKasKeluar,
        totalJiwaDasawisma,
        totalLakiLaki,
        totalPerempuan,
        totalBalita,
        totalIbuHamil,
        totalLansia,
        persentaseRumahSehat,
        totalPolybagToga,
        togaSiapPanenCount,

        notifications,
        dismissNotification,

        clearAllData,
        resetToDefaultData,
        exportDataJSON,
        importDataJSON,

        currentUser,
        isAuthenticated,
        userAccounts,
        login,
        quickLogin,
        logout,
        changePassword,
        resetPasswordToDefault,

        cloudSyncStatus,
        syncToCloud,
        syncFromCloud,
        isCloudModalOpen,
        setIsCloudModalOpen,
      }}
    >
      {children}
    </PKKContext.Provider>
  );
};

export const usePKK = () => {
  const context = useContext(PKKContext);
  if (!context) {
    throw new Error('usePKK must be used within a PKKProvider');
  }
  return context;
};
