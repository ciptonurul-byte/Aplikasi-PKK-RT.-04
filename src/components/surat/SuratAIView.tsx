import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Copy,
  Printer,
  Share2,
  CheckCircle2,
  RefreshCw,
  Send,
  Download,
  BookOpen,
  MessageSquare,
  Bot,
  User,
  FileDown,
  FileType,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import { Badge } from '../common/Badge';
import { printSuratNaskah } from '../../utils/printHelper';
import { exportSuratResmiPDF, exportSuratResmiWord } from '../../utils/reportExporter';
import { cleanSuratBodyText, parseSuratBodyBlocks, alignColonsInPlainText } from '../../utils/cleanSurat';

export const SuratAIView: React.FC = () => {
  const { profil, kegiatanList } = usePKK();

  const [activeTab, setActiveTab] = useState<'surat' | 'asisten-ai'>('surat');

  // Generator State
  const [jenisSurat, setJenisSurat] = useState('Surat Undangan Pertemuan Rutin & Arisan');
  const [nomorSurat, setNomorSurat] = useState(`05/UND/PKK-${profil.namaRT.replace(/\s+/g, '')}/V/2026`);
  const [perihal, setPerihal] = useState('Undangan Pertemuan Rutin & Arisan TP PKK');
  const [tanggalAcara, setTanggalAcara] = useState('2026-05-20');
  const [waktuAcara, setWaktuAcara] = useState('09.00 WIB s/d selesai');
  const [tempatAcara, setTempatAcara] = useState(`Balai Warga ${profil.namaRT}`);
  const [tujuanSurat, setTujuanSurat] = useState('Ibu-Ibu Pengurus & Anggota PKK RT');
  const [agendaTambahan, setAgendaTambahan] = useState(
    '1. Pembukaan dan doa bersama\n2. Menyanyikan Lagu Mars PKK\n3. Sambutan Ketua TP PKK RT\n4. Evaluasi pendataan Dasawisma & Posyandu balita\n5. Pembagian arisan bulanan & kas anggota\n6. Lain-lain dan Penutup'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [waTextCopied, setWaTextCopied] = useState(false);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'bot'; text: string; time: string }[]
  >([
    {
      sender: 'bot',
      text: `Halo Ibu Pengurus PKK ${profil.namaRT}! Saya Asisten AI PKK. Anda dapat menanyakan tentang 10 Program Pokok PKK, tugas 4 Pokja, administrasi 6 Buku Wajib, atau pembuatan draft teks sambutan ketua. Ada yang bisa saya bantu?`,
      time: 'Baru saja',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const formatAgendaList = (raw: string) => {
    const lines = (raw || '')
      .split(/\n|,|;/)
      .map((s) => s.replace(/^\s*\d+[\.\)]\s*|^\s*[-*•]\s*/, '').trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return '1. Pembukaan dan doa bersama\n2. Menyanyikan Lagu Mars PKK\n3. Sambutan Ketua TP PKK RT\n4. Evaluasi pendataan Dasawisma & Posyandu balita\n5. Pembagian arisan bulanan & kas anggota\n6. Lain-lain dan Penutup';
    }
    return lines.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
  };

  const getFallbackDraftText = () => {
    return `Kepada Yth.
${tujuanSurat}
di Tempat

Dengan hormat,
Puji syukur senantiasa kita panjatkan ke hadirat Tuhan Yang Maha Esa atas limpahan rahmat dan karunia-Nya. Semoga Ibu/Saudari senantiasa dalam keadaan sehat walafiat serta dimudahkan dalam menjalankan aktivitas sehari-hari.

Sehubungan dengan pelaksanaan program kerja TP PKK ${profil.namaRT}, kami mengharapkan kehadiran Ibu/Saudari pada:

Hari / Tanggal : ${new Date(tanggalAcara).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}
Waktu          : ${waktuAcara}
Tempat         : ${tempatAcara}
Acara          : ${perihal}

Adapun susunan acara / agenda pembahasan adalah sebagai berikut:
${formatAgendaList(agendaTambahan)}

Catatan:
Dimohon hadir tepat waktu dan membawa catatan Dasawisma.

Mengingat pentingnya agenda tersebut, kami sangat mengharapkan kehadiran Ibu/Saudari tepat pada waktunya.

Demikian undangan ini kami sampaikan. Atas perhatian, kehadiran, dan kerja sama yang baik, kami ucapkan terima kasih.`;
  };

  const handleGenerateSurat = async () => {
    setIsLoading(true);
    try {
      const payload = {
        jenisSurat,
        nomorSurat,
        perihal,
        tanggalAcara,
        waktuAcara,
        tempatAcara,
        tujuanSurat,
        agendaTambahan,
        profilRT: profil,
      };

      const res = await fetch('/api/ai/surat-pkk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const textResult = data.surat || data.result || data.text;
      if (textResult) {
        setGeneratedLetter(cleanSuratBodyText(textResult));
      } else {
        throw new Error('No content returned');
      }
    } catch (e) {
      console.warn('Using client-side fallback draft for PKK letter:', e);
      setGeneratedLetter(getFallbackDraftText());
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const textToExport = generatedLetter || getFallbackDraftText();
    exportSuratResmiPDF(textToExport, profil, {
      nomorSurat,
      perihal,
      tanggal: new Date(tanggalAcara).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      sifat: 'Penting',
      lampiran: '1 (satu) Berkas',
      tujuan: tujuanSurat,
    });
  };

  const handleDownloadWord = async () => {
    const textToExport = generatedLetter || getFallbackDraftText();
    await exportSuratResmiWord(textToExport, profil, {
      nomorSurat,
      perihal,
      tanggal: new Date(tanggalAcara).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      sifat: 'Penting',
      lampiran: '1 (satu) Berkas',
      tujuan: tujuanSurat,
    });
  };

  const handleCopy = () => {
    const raw = generatedLetter || getFallbackDraftText();
    const alignedText = alignColonsInPlainText(raw);
    navigator.clipboard.writeText(alignedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyWA = () => {
    const waText = `*UNDANGAN RESMI PKK ${profil.namaRT}* 🌸
Kepada Yth: ${tujuanSurat}

Assalamu'alaikum Wr. Wb. / Salam Sejahtera,
Ibu-ibu warga ${profil.namaRT}, dimohon kehadirannya pada pertemuan rutin PKK:

📅 *Hari/Tgl:* ${new Date(tanggalAcara).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}
⏰ *Waktu:* ${waktuAcara}
📍 *Tempat:* ${tempatAcara}
📌 *Acara:* ${perihal}

📝 *Susunan Acara / Agenda Pembahasan:*
${formatAgendaList(agendaTambahan)}

Kehadiran ibu-ibu sangat kami harapkan demi kemajuan dan kekompakan warga kita. Terima kasih! 🙏
_TP PKK ${profil.namaRT}_`;

    navigator.clipboard.writeText(waText);
    setWaTextCopied(true);
    setTimeout(() => setWaTextCopied(false), 2000);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: userText,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          profilRT: profil,
        }),
      });
      const data = await res.json();
      const botResponse =
        data.response ||
        data.reply ||
        data.notula ||
        data.result ||
        'Untuk kegiatan PKK tersebut, pastikan tercatat dalam 6 Buku Wajib dan dikoordinasikan dengan Pokja terkait. Ada hal lain yang ingin disiapkan?';

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botResponse,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Tentu Bu, sesuai pedoman Rakernas PKK, setiap kegiatan Pokja wajib didokumentasikan di Buku V dan pengeluaran kas dicatat di Buku III oleh Bendahara.',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Generator Surat Resmi PKK & Asisten AI
            </h2>
            <Badge variant="purple" size="sm">
              AI Gemini Smart
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Buku VI: Tata Naskah Dinas TP PKK Standar Rakernas, Pembuatan Undangan & Notula Cepat
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('surat')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'surat'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Draft Surat Resmi
          </button>
          <button
            onClick={() => setActiveTab('asisten-ai')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'asisten-ai'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Sobat PKK AI</span>
          </button>
        </div>
      </div>

      {activeTab === 'surat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Configuration */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Naskah Surat Dinas</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Surat PKK *
                </label>
                <select
                  value={jenisSurat || ''}
                  onChange={(e) => {
                    setJenisSurat(e.target.value);
                    setPerihal(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="Surat Undangan Pertemuan Rutin & Arisan">
                    Surat Undangan Pertemuan Rutin & Arisan
                  </option>
                  <option value="Surat Undangan Posyandu Balita & Lansia">
                    Surat Undangan Posyandu Balita & Lansia
                  </option>
                  <option value="Surat Permohonan Bantuan / Narasumber Pelatihan">
                    Surat Permohonan Narasumber Pelatihan
                  </option>
                  <option value="Berita Acara Rapat Pemilihan Pengurus / Kader">
                    Berita Acara Pemilihan Pengurus / Kader
                  </option>
                  <option value="Surat Edaran Kerja Bakti HATINYA PKK">
                    Surat Edaran Kerja Bakti HATINYA PKK
                  </option>
                  <option value="Surat Keterangan Rekomendasi Warga">
                    Surat Keterangan Rekomendasi Warga
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Surat
                  </label>
                  <input
                    type="text"
                    value={nomorSurat || ''}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Acara
                  </label>
                  <input
                    type="date"
                    value={tanggalAcara || ''}
                    onChange={(e) => setTanggalAcara(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Waktu / Jam
                  </label>
                  <input
                    type="text"
                    value={waktuAcara || ''}
                    onChange={(e) => setWaktuAcara(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tempat / Lokasi
                  </label>
                  <input
                    type="text"
                    value={tempatAcara || ''}
                    onChange={(e) => setTempatAcara(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kepada Yth (Sasaran Penerima)
                </label>
                <input
                  type="text"
                  value={tujuanSurat || ''}
                  onChange={(e) => setTujuanSurat(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Agenda / Susunan Acara (Nomor Urut)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAgendaTambahan(formatAgendaList(agendaTambahan))}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                    title="Otomatis rapikan penomoran 1, 2, 3... ke bawah"
                  >
                    <span>Rapikan Nomor (1, 2, 3...)</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={agendaTambahan || ''}
                  onChange={(e) => setAgendaTambahan(e.target.value)}
                  placeholder="1. Pembukaan dan doa&#10;2. Menyanyikan Mars PKK&#10;3. Sambutan Ketua TP PKK&#10;4. Evaluasi Dasawisma..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 leading-relaxed font-mono sm:font-sans"
                />
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                  Tips: Tulis setiap susunan agenda per baris. Sistem otomatis menomori secara urut ke bawah.
                </p>
              </div>

              <button
                id="btn-submit-generate-surat"
                onClick={handleGenerateSurat}
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyusun Surat dengan AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Naskah Surat Resmi</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Letter Preview & Output */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Pratinjau Tata Naskah Resmi PKK
                    </h3>
                  </div>

                  {generatedLetter && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        id="btn-download-pdf-surat"
                        onClick={handleDownloadPDF}
                        title="Download Berkas PDF Resmi"
                        className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors border border-rose-200/60 dark:border-rose-800/60"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Unduh PDF</span>
                      </button>

                      <button
                        id="btn-download-word-surat"
                        onClick={handleDownloadWord}
                        title="Download Berkas Word (.docx) Editable"
                        className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 hover:bg-blue-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors border border-blue-200/60 dark:border-blue-800/60"
                      >
                        <FileType className="w-3.5 h-3.5" />
                        <span>Unduh Word</span>
                      </button>

                      <button
                        onClick={handleCopyWA}
                        title="Salin Format Pesan WhatsApp"
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>{waTextCopied ? 'Tersalin WA!' : 'Format WA'}</span>
                      </button>

                      <button
                        onClick={handleCopy}
                        title="Salin Naskah Lengkap"
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (generatedLetter) {
                            printSuratNaskah(generatedLetter, profil, {
                              nomorSurat,
                              perihal,
                              sifat: 'Penting',
                            });
                          } else {
                            window.print();
                          }
                        }}
                        title="Cetak Naskah Surat Resmi"
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Letter Content Area */}
                <div className="mt-4 p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-serif text-slate-800 dark:text-slate-200 leading-relaxed min-h-[380px]">
                  {generatedLetter ? (
                    <div className="space-y-4">
                      {/* Kop Surat Resmi */}
                      <div className="text-center pb-3 border-b-2 border-emerald-700 dark:border-emerald-500">
                        <p className="font-bold text-[10px] tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                          PEMBERDAYAAN DAN KESEJAHTERAAN KELUARGA (PKK)
                        </p>
                        <h4 className="font-bold text-sm sm:text-base text-emerald-800 dark:text-emerald-400 uppercase tracking-wide my-0.5">
                          TIM PENGGERAK PKK {profil.namaRT} / {profil.namaRW}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 uppercase">
                          KELURAHAN {profil.namaKelurahan}, KECAMATAN {profil.namaKecamatan}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 uppercase">
                          {profil.namaKota} - PROVINSI {profil.provinsi}
                        </p>
                        <p className="text-[9.5px] italic text-slate-500 dark:text-slate-400 mt-0.5">
                          Sekretariat: {profil.alamatSekretariat || `Balai Warga ${profil.namaRT}`}
                        </p>
                      </div>

                      {/* Metadata Surat: Nomor, Sifat, Lampiran, Perihal & Tanggal */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans border-b border-slate-200 dark:border-slate-700/60 pb-3">
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            <span className="w-16 text-slate-500">Nomor</span>
                            <span className="text-slate-400">:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{nomorSurat}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-16 text-slate-500">Sifat</span>
                            <span className="text-slate-400">:</span>
                            <span className="text-slate-700 dark:text-slate-300">Penting</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-16 text-slate-500">Lampiran</span>
                            <span className="text-slate-400">:</span>
                            <span className="text-slate-700 dark:text-slate-300">1 (satu) Berkas</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-16 text-slate-500">Perihal</span>
                            <span className="text-slate-400">:</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 underline">{perihal}</span>
                          </div>
                        </div>
                        <div className="sm:text-right text-slate-600 dark:text-slate-400 text-[11px] self-start">
                          {profil.namaKota},{' '}
                          {new Date(tanggalAcara).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      {/* Batang Tubuh Surat yang Bersih (Rata Kanan Kiri & Titik Dua Sejajar Vertikal) */}
                      <div className="text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] leading-relaxed pt-1">
                        {parseSuratBodyBlocks(generatedLetter).map((block, bIdx) => {
                          if (block.type === 'paragraph') {
                            return (
                              <p
                                key={bIdx}
                                className={`my-2 text-justify [text-align-last:left] ${
                                  block.isBold ? 'font-bold text-slate-900 dark:text-slate-100' : ''
                                }`}
                              >
                                {block.text}
                              </p>
                            );
                          }
                          if (block.type === 'key-value') {
                            return (
                              <div key={bIdx} className="my-2.5 ml-2 sm:ml-4 overflow-x-auto">
                                <table className="border-collapse text-xs sm:text-[13px] leading-relaxed">
                                  <tbody>
                                    {block.items.map((item, itIdx) => (
                                      <tr key={itIdx} className="align-top">
                                        <td className="pr-3 py-0.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                          {item.label}
                                        </td>
                                        <td className="px-1.5 py-0.5 text-center text-slate-700 dark:text-slate-300 font-bold">
                                          :
                                        </td>
                                        <td className="pl-2 py-0.5 text-slate-800 dark:text-slate-200 text-justify [text-align-last:left]">
                                          {item.value}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          }
                          if (block.type === 'numbered-list') {
                            return (
                              <div key={bIdx} className="my-2.5 ml-2 sm:ml-4 overflow-x-auto">
                                <table className="border-collapse text-xs sm:text-[13px] leading-relaxed w-full max-w-2xl">
                                  <tbody>
                                    {block.items.map((item, itIdx) => (
                                      <tr key={itIdx} className="align-top">
                                        <td className="w-7 sm:w-8 font-bold text-slate-800 dark:text-slate-200 pr-2 py-0.5 select-none whitespace-nowrap">
                                          {item.num || `${itIdx + 1}.`}
                                        </td>
                                        <td className="py-0.5 text-slate-800 dark:text-slate-200 text-justify [text-align-last:left]">
                                          {item.text}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          }
                          if (block.type === 'list') {
                            return (
                              <ul key={bIdx} className="my-2 ml-6 list-disc space-y-1">
                                {block.items.map((it, itIdx) => (
                                  <li key={itIdx}>{it}</li>
                                ))}
                              </ul>
                            );
                          }
                          return null;
                        })}
                      </div>

                      {/* Blok Tanda Tangan Block Style (Ketua & Sekretaris - 1cm di bawah kalimat terakhir) */}
                      <div className="pt-4 mt-2 font-serif text-xs">
                        <div className="text-center mb-2">
                          <p className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                            TIM PENGGERAK PKK {profil.namaRT}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6 text-center">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              Ketua,
                            </p>
                            <div className="h-12 sm:h-14"></div>
                            <p className="font-bold underline text-slate-900 dark:text-slate-100">
                              ( Ny. {profil.namaKetua} )
                            </p>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              Sekretaris,
                            </p>
                            <div className="h-12 sm:h-14"></div>
                            <p className="font-bold underline text-slate-900 dark:text-slate-100">
                              ( Ny. {profil.namaSekretaris || 'Sekretaris'} )
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400">
                      <FileText className="w-12 h-12 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600 dark:text-slate-400">
                        Belum ada naskah surat yang di-generate.
                      </p>
                      <p className="text-[11px] max-w-sm mt-1">
                        Pilih jenis surat di sebelah kiri, lengkapi tanggal dan agenda, lalu klik{' '}
                        <strong>"Generate Naskah Surat Resmi"</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Specialized Export Cards for PDF & Word */}
            {generatedLetter && (
              <div className="p-4 bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 rounded-2xl border border-emerald-100 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Unduh Berkas Konsep Surat Resmi
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Standar Tata Naskah TP PKK Rakernas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* PDF Card */}
                  <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-rose-100 dark:border-rose-950/60 shadow-2xs flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-800 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 rounded-lg">
                            <FileDown className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Dokumen PDF (.pdf)
                          </span>
                        </div>
                        <Badge variant="red" size="sm">Siap Cetak A4</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                        Format PDF beresolusi tinggi dengan Kop Surat dinas TP PKK, nomor surat, garis pembatas, dan tanda tangan Ketua/Sekretaris.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadPDF}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  {/* Word Card */}
                  <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-blue-100 dark:border-blue-950/60 shadow-2xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-lg">
                            <FileType className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Dokumen Word (.docx)
                          </span>
                        </div>
                        <Badge variant="blue" size="sm">Dapat Diedit</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                        Format Microsoft Word (.docx) lengkap dengan kop dinas dan layout resmi. Bebas diedit atau ditambah lampiran tabel.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadWord}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Word (.docx)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: SOBAT PKK AI CHATBOT */
        <div className="max-w-3xl mx-auto p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[550px]">
          {/* Chat Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-xl shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Sobat PKK AI - Asisten Konsultasi & Sambutan
              </h3>
              <p className="text-[11px] text-slate-500">
                Konsultasi juknis Rakernas PKK, 10 Program Pokok, dan naskah pidato ketua
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-thin">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0 text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sobat PKK AI sedang mengetik...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendChat}
            className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Tanyakan juknis PKK, minta draft sambutan, atau ide program..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
