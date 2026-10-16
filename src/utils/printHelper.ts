import { ProfilPKKRT, AnggotaPKK, KegiatanPKK, SuratDinasPKK, TransaksiKas, RekapIuranAnggota } from '../types/pkk';
import { LOGO_PKK_BASE64 } from '../assets/logoPKK';
import { cleanSuratBodyText, formatSuratBodyHtml } from './cleanSurat';
import { KwitansiIuranPayload, angkaKeTerbilang, NAMA_BULAN_LENGKAP } from './whatsappHelper';

/**
 * Creates and prints an isolated HTML document using an invisible iframe
 * to guarantee 100% clean formatting and bypass iframe sandbox constraints.
 */
export function executePrint(htmlContent: string, title = 'Cetak Dokumen PKK'): void {
  // Method: Use hidden iframe for seamless, background print preview
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    // Fallback: direct window.print()
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm 12mm 15mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 12pt;
            line-height: 1.5;
          }
          .sans {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .kop-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 8px;
            padding-bottom: 8px;
          }
          .kop-logo {
            width: 78px;
            height: 88px;
            object-fit: contain;
            flex-shrink: 0;
          }
          .kop-text {
            text-align: center;
            flex: 1;
          }
          .kop-text h4 {
            margin: 0;
            font-size: 11pt;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          .kop-text h2 {
            margin: 2px 0;
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
          }
          .kop-text p {
            margin: 1px 0;
            font-size: 9.5pt;
            color: #334155;
          }
          .kop-divider {
            border: 0;
            border-top: 3px double #047857;
            margin: 0 0 16px 0;
          }
          .doc-title {
            text-align: center;
            font-weight: bold;
            text-decoration: underline;
            font-size: 13pt;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .doc-subtitle {
            text-align: center;
            font-size: 10pt;
            margin-bottom: 20px;
            color: #475569;
          }
          table.pkk-table {
            width: 100%;
            border-collapse: collapse;
            margin: 14px 0;
            font-size: 10pt;
            font-family: Arial, sans-serif;
          }
          table.pkk-table th, table.pkk-table td {
            border: 1px solid #0f172a;
            padding: 6px 8px;
            vertical-align: middle;
          }
          table.pkk-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-align: center;
          }
          .signature-section {
            margin-top: 35px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            font-size: 11pt;
          }
          .signature-box {
            text-align: center;
            width: 220px;
          }
          .signature-space {
            height: 70px;
          }
          .signature-name {
            font-weight: bold;
            text-decoration: underline;
          }
          .page-break {
            page-break-after: always;
          }
          .no-break {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `);
  doc.close();

  // Wait for resources (images, fonts) to finish rendering before printing
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print():', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 350);
}

/**
 * Generate standard HTML Kop Surat PKK
 */
export function getKopSuratHTML(profil: ProfilPKKRT): string {
  const logo = profil.logoUrl || LOGO_PKK_BASE64;
  return `
    <div class="kop-container">
      <img src="${logo}" alt="Logo PKK" class="kop-logo" />
      <div class="kop-text">
        <h4>PEMBERDAYAAN DAN KESEJAHTERAAN KELUARGA (PKK)</h4>
        <h2>TIM PENGGERAK PKK ${profil.namaRT} / ${profil.namaRW}</h2>
        <p>KELURAHAN ${profil.namaKelurahan.toUpperCase()}, KECAMATAN ${profil.namaKecamatan.toUpperCase()}</p>
        <p>${profil.namaKota.toUpperCase()} - PROVINSI ${profil.provinsi.toUpperCase()}</p>
        <p style="font-size: 8.5pt; font-style: italic;">Sekretariat: ${profil.alamatSekretariat || `Balai Pertemuan Warga ${profil.namaRT}`}</p>
      </div>
    </div>
    <hr class="kop-divider" />
  `;
}

/**
 * Print Surat Resmi AI / Naskah Surat Dinas PKK
 */
export function printSuratNaskah(
  content: string,
  profil: ProfilPKKRT,
  meta?: { nomorSurat?: string; perihal?: string; tanggal?: string; sifat?: string }
): void {
  const todayStr = meta?.tanggal || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const cleanBody = cleanSuratBodyText(content);

  const bodyHtml = `
    ${getKopSuratHTML(profil)}

    ${meta?.nomorSurat ? `
    <table style="width: 100%; font-size: 11pt; margin-bottom: 15px; border-collapse: collapse;">
      <tr>
        <td style="width: 80px; vertical-align: top;">Nomor</td>
        <td style="width: 10px; vertical-align: top;">:</td>
        <td style="vertical-align: top;"><strong>${meta.nomorSurat}</strong></td>
        <td style="text-align: right; vertical-align: top;">${profil.namaKota}, ${todayStr}</td>
      </tr>
      <tr>
        <td style="vertical-align: top;">Sifat</td>
        <td style="vertical-align: top;">:</td>
        <td style="vertical-align: top;">${meta.sifat || 'Penting / Biasa'}</td>
        <td></td>
      </tr>
      <tr>
        <td style="vertical-align: top;">Lampiran</td>
        <td style="vertical-align: top;">:</td>
        <td style="vertical-align: top;">-</td>
        <td></td>
      </tr>
      <tr>
        <td style="vertical-align: top;">Perihal</td>
        <td style="vertical-align: top;">:</td>
        <td style="vertical-align: top;"><u>${meta.perihal || 'Undangan / Pemberitahuan Kegiatan PKK'}</u></td>
        <td></td>
      </tr>
    </table>
    ` : ''}

    <div style="font-size: 11pt; line-height: 1.6; margin-top: 10px;">
      ${formatSuratBodyHtml(cleanBody)}
    </div>

    <div style="margin-top: 1cm; font-family: 'Times New Roman', serif;">
      <div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 10px; text-transform: uppercase;">
        TIM PENGGERAK PKK ${profil.namaRT}
      </div>
      <div style="display: flex; justify-content: space-between; text-align: center; font-size: 11pt;">
        <div style="width: 45%;">
          <p style="font-weight: bold; margin-bottom: 45px;">Ketua,</p>
          <p style="font-weight: bold; text-decoration: underline;">( Ny. ${profil.namaKetua || 'Ketua TP PKK'} )</p>
        </div>
        <div style="width: 45%;">
          <p style="font-weight: bold; margin-bottom: 45px;">Sekretaris,</p>
          <p style="font-weight: bold; text-decoration: underline;">( Ny. ${profil.namaSekretaris || 'Sekretaris'} )</p>
        </div>
      </div>
    </div>
  `;

  executePrint(bodyHtml, `Surat Resmi TP PKK ${profil.namaRT}`);
}

/**
 * Print Lembar Notulen Kegiatan Rapat / Agenda (Buku V PKK)
 */
export function printLembarNotula(kegiatan: KegiatanPKK, profil: ProfilPKKRT): void {
  const tanggalFormat = new Date(kegiatan.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const bodyHtml = `
    ${getKopSuratHTML(profil)}

    <div class="doc-title">LEMBAR NOTULENSI KEGIATAN & PERTEMUAN PKK</div>
    <div class="doc-subtitle">BUKU V (DAFTAR AGENDA & NOTULA KEGIATAN) TAHUN ${new Date(kegiatan.tanggal).getFullYear()}</div>

    <table style="width: 100%; font-size: 11pt; margin-bottom: 20px; line-height: 1.6;">
      <tr>
        <td style="width: 150px; font-weight: bold;">Nama Kegiatan</td>
        <td style="width: 10px;">:</td>
        <td><strong>${kegiatan.namaKegiatan}</strong></td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Hari / Tanggal</td>
        <td>:</td>
        <td>${tanggalFormat}</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Waktu / Tempat</td>
        <td>:</td>
        <td>${kegiatan.waktuMulai} - ${kegiatan.waktuSelesai} WIB / ${kegiatan.lokasi}</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Penanggung Jawab / Pokja</td>
        <td>:</td>
        <td>${kegiatan.pokjaPengampu} (Koordinator: ${kegiatan.penanggungJawab})</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Jumlah Kehadiran</td>
        <td>:</td>
        <td>${kegiatan.pesertaHadir} Orang Kader & Pengurus (Target: ${kegiatan.targetPeserta})</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Realisasi Anggaran</td>
        <td>:</td>
        <td>Rp ${(kegiatan.anggaranRealisasi || 0).toLocaleString('id-ID')}</td>
      </tr>
    </table>

    <div style="border-top: 1px solid #cbd5e1; padding-top: 12px; margin-bottom: 20px;">
      <h3 style="font-size: 12pt; font-weight: bold; margin-bottom: 6px;">Ringkasan Acara & Notulensi Hasil Rapat:</h3>
      <div style="font-size: 11pt; line-height: 1.6; white-space: pre-line; background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px;">
        ${kegiatan.notulensi || 'Tidak ada catatan notulensi khusus.'}
      </div>
    </div>

    ${kegiatan.deskripsi ? `
    <div style="margin-bottom: 20px;">
      <h4 style="font-size: 11pt; font-weight: bold; margin-bottom: 4px;">Deskripsi / Latar Belakang Kegiatan:</h4>
      <p style="font-size: 10.5pt; color: #334155; margin: 0;">${kegiatan.deskripsi}</p>
    </div>
    ` : ''}

    <div class="signature-section">
      <div class="signature-box">
        <p>Notulis / Penanggung Jawab,</p>
        <p style="font-weight: bold;">${kegiatan.pokjaPengampu}</p>
        <div class="signature-space"></div>
        <p class="signature-name">${kegiatan.penanggungJawab}</p>
      </div>

      <div class="signature-box">
        <p>${profil.namaKota}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="font-weight: bold;">Ketua TP PKK ${profil.namaRT}</p>
        <div class="signature-space"></div>
        <p class="signature-name">${profil.namaKetua}</p>
      </div>
    </div>
  `;

  executePrint(bodyHtml, `Notulen - ${kegiatan.namaKegiatan}`);
}

/**
 * Print Kartu Tanda Anggota (KTA) Resmi PKK
 */
export function printKTAPKK(anggota: AnggotaPKK, profil: ProfilPKKRT): void {
  const logo = profil.logoUrl || LOGO_PKK_BASE64;

  const bodyHtml = `
    <div class="sans" style="text-align: center; margin-bottom: 20px;">
      <h3 style="margin: 0; font-size: 14pt; font-weight: bold;">KARTU TANDA ANGGOTA (KTA) TP PKK</h3>
      <p style="margin: 2px 0; font-size: 10pt; color: #64748b;">${profil.namaRT} / ${profil.namaRW}, KEL. ${profil.namaKelurahan.toUpperCase()}, KEC. ${profil.namaKecamatan.toUpperCase()}</p>
    </div>

    <!-- KTA Card Frame -->
    <div class="sans" style="max-width: 500px; margin: 0 auto; border: 3px solid #047857; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); background: linear-gradient(135deg, #065f46 0%, #047857 50%, #0d9488 100%); color: #ffffff; padding: 18px; position: relative;">
      
      <!-- Card Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid rgba(255,255,255,0.25); padding-bottom: 10px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 48px; height: 48px; background: #ffffff; border-radius: 10px; padding: 3px; display: flex; align-items: center; justify-content: center;">
            <img src="${logo}" alt="Logo PKK" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div>
            <div style="font-size: 11pt; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">TIM PENGGERAK PKK</div>
            <div style="font-size: 9pt; opacity: 0.9;">${profil.namaRT} ${profil.namaRW} - ${profil.namaKelurahan}</div>
          </div>
        </div>
        <div style="text-align: right; font-size: 8pt; background: rgba(255,255,255,0.15); padding: 4px 8px; border-radius: 6px; font-weight: bold;">
          KTA RESMI
        </div>
      </div>

      <!-- Card Body -->
      <div style="display: flex; gap: 14px; align-items: center;">
        <div style="width: 85px; height: 105px; background: #f8fafc; border: 2px solid #ffffff; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #047857; font-weight: bold; flex-shrink: 0;">
          <img src="${logo}" alt="Photo" style="width: 55px; height: 55px; object-fit: contain; margin-bottom: 4px;" />
          <span style="font-size: 7.5pt; color: #047857;">PAS FOTO</span>
        </div>

        <div style="flex: 1; font-size: 9.5pt; line-height: 1.5;">
          <div style="font-size: 12pt; font-weight: 800; color: #fef08a; margin-bottom: 2px;">${anggota.nama.toUpperCase()}</div>
          <div><strong>NIK:</strong> ${anggota.nik}</div>
          <div><strong>Jabatan:</strong> <span style="background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 4px; font-weight: bold;">${anggota.jabatan}</span></div>
          <div><strong>Pokja / Bidang:</strong> ${anggota.pokja}</div>
          <div><strong>Alamat:</strong> ${anggota.alamat}</div>
          <div><strong>Bergabung:</strong> ${anggota.tanggalBergabung || '-'}</div>
        </div>
      </div>

      <!-- Card Footer -->
      <div style="margin-top: 14px; pt: 8px; border-top: 1px solid rgba(255,255,255,0.2); display: flex; justify-content: space-between; align-items: flex-end; font-size: 8pt;">
        <div>
          <span style="opacity: 0.8;">Masa Berlaku: </span><strong>Aktif Selama Menjabat</strong>
        </div>
        <div style="text-align: center;">
          <div>Ketua TP PKK ${profil.namaRT}</div>
          <div style="height: 25px;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${profil.namaKetua}</div>
        </div>
      </div>
    </div>

    <div class="sans" style="margin-top: 25px; text-align: center; font-size: 9pt; color: #64748b;">
      <p>Petunjuk: Cetak pada kertas foto / karton tebal, kemudian gunting sesuai garis tepi kartu.</p>
    </div>
  `;

  executePrint(bodyHtml, `KTA PKK - ${anggota.nama}`);
}

/**
 * Print 6 Buku Wajib PKK (Standar Rakernas)
 */
export function printBukuWajibLengkap(
  bukuId: number,
  profil: ProfilPKKRT,
  data: {
    anggotaList: AnggotaPKK[];
    kegiatanList: KegiatanPKK[];
    transaksiKas: TransaksiKas[];
    dasawismaList?: any[];
  }
): void {
  let content = '';
  const year = new Date().getFullYear();

  if (bukuId === 1) {
    // Buku 1: Daftar Anggota TP PKK & Kader
    content = `
      <div class="doc-title">BUKU I : DAFTAR ANGGOTA TIM PENGGERAK PKK DAN KADER PKK</div>
      <div class="doc-subtitle">${profil.namaRT} / ${profil.namaRW}, KELURAHAN ${profil.namaKelurahan.toUpperCase()} TAHUN ${year}</div>

      <table class="pkk-table">
        <thead>
          <tr>
            <th style="width: 30px;">NO</th>
            <th>NAMA LENGKAP</th>
            <th>JABATAN</th>
            <th>POKJA / SEKSI</th>
            <th>TEMPAT, TGL LAHIR</th>
            <th>PENDIDIKAN</th>
            <th>STATUS</th>
            <th>ALAMAT</th>
          </tr>
        </thead>
        <tbody>
          ${data.anggotaList.map((a, i) => `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td><strong>${a.nama}</strong></td>
              <td>${a.jabatan}</td>
              <td>${a.pokja}</td>
              <td>${a.tempatLahir || '-'}, ${a.tanggalLahir || '-'}</td>
              <td style="text-align: center;">${a.pendidikanTerakhir || '-'}</td>
              <td style="text-align: center;">${a.status}</td>
              <td>${a.alamat}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (bukuId === 5) {
    // Buku 5: Agenda Kegiatan
    content = `
      <div class="doc-title">BUKU V : BUKU AGENDA DAN NOTULA KEGIATAN TP PKK</div>
      <div class="doc-subtitle">${profil.namaRT} / ${profil.namaRW}, KELURAHAN ${profil.namaKelurahan.toUpperCase()} TAHUN ${year}</div>

      <table class="pkk-table">
        <thead>
          <tr>
            <th style="width: 30px;">NO</th>
            <th>HARI / TANGGAL</th>
            <th>NAMA KEGIATAN</th>
            <th>POKJA</th>
            <th>WAKTU & TEMPAT</th>
            <th>PESERTA</th>
            <th>PENANGGUNG JAWAB</th>
            <th>ANGGARAN</th>
          </tr>
        </thead>
        <tbody>
          ${data.kegiatanList.map((k, i) => `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td>${k.tanggal}</td>
              <td><strong>${k.namaKegiatan}</strong></td>
              <td>${k.pokjaPengampu}</td>
              <td>${k.waktuMulai} - ${k.waktuSelesai} WIB<br/>${k.lokasi}</td>
              <td style="text-align: center;">${k.pesertaHadir} Org</td>
              <td>${k.penanggungJawab}</td>
              <td style="text-align: right;">Rp ${(k.anggaranRealisasi || 0).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (bukuId === 6) {
    // Buku 6: Keuangan / Kas
    const totalMasuk = data.transaksiKas.filter(t => t.jenis === 'Masuk').reduce((acc, c) => acc + c.jumlah, 0);
    const totalKeluar = data.transaksiKas.filter(t => t.jenis === 'Keluar').reduce((acc, c) => acc + c.jumlah, 0);
    const saldo = totalMasuk - totalKeluar;

    content = `
      <div class="doc-title">BUKU VI : BUKU KAS KEUANGAN TP PKK</div>
      <div class="doc-subtitle">${profil.namaRT} / ${profil.namaRW}, KELURAHAN ${profil.namaKelurahan.toUpperCase()} TAHUN ${year}</div>

      <table class="pkk-table">
        <thead>
          <tr>
            <th style="width: 30px;">NO</th>
            <th>TANGGAL</th>
            <th>URAIAN TRANSAKSI</th>
            <th>KATEGORI</th>
            <th>PENERIMAAN (DEBET)</th>
            <th>PENGELUARAN (KREDIT)</th>
            <th>SALDO AKHIR</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            let runningSaldo = 0;
            return data.transaksiKas.map((t, i) => {
              if (t.jenis === 'Masuk') runningSaldo += t.jumlah;
              else runningSaldo -= t.jumlah;

              return `
                <tr>
                  <td style="text-align: center;">${i + 1}</td>
                  <td>${t.tanggal}</td>
                  <td>${t.keterangan}</td>
                  <td>${t.kategori}</td>
                  <td style="text-align: right; color: #047857;">${t.jenis === 'Masuk' ? `Rp ${t.jumlah.toLocaleString('id-ID')}` : '-'}</td>
                  <td style="text-align: right; color: #b91c1c;">${t.jenis === 'Keluar' ? `Rp ${t.jumlah.toLocaleString('id-ID')}` : '-'}</td>
                  <td style="text-align: right; font-weight: bold;">Rp ${runningSaldo.toLocaleString('id-ID')}</td>
                </tr>
              `;
            }).join('');
          })()}
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="4" style="text-align: right;">TOTAL PENERIMAAN / PENGELUARAN / SALDO AKHIR :</td>
            <td style="text-align: right; color: #047857;">Rp ${totalMasuk.toLocaleString('id-ID')}</td>
            <td style="text-align: right; color: #b91c1c;">Rp ${totalKeluar.toLocaleString('id-ID')}</td>
            <td style="text-align: right; color: #0369a1;">Rp ${saldo.toLocaleString('id-ID')}</td>
          </tr>
        </tfoot>
      </table>
    `;
  } else {
    // Default format for other books
    content = `
      <div class="doc-title">BUKU ADMINISTRASI TP PKK (BUKU ${bukuId})</div>
      <div class="doc-subtitle">${profil.namaRT} / ${profil.namaRW}, KELURAHAN ${profil.namaKelurahan.toUpperCase()} TAHUN ${year}</div>
      <p style="text-align: center; font-style: italic; margin: 30px 0;">Dokumen administrasi siap diverifikasi sesuai Standar Baku Rakernas TP PKK.</p>
    `;
  }

  const fullHtml = `
    ${getKopSuratHTML(profil)}
    ${content}
    <div class="signature-section">
      <div class="signature-box">
        <p>Mengetahui,</p>
        <p style="font-weight: bold;">Sekretaris TP PKK ${profil.namaRT}</p>
        <div class="signature-space"></div>
        <p class="signature-name">${profil.namaSekretaris || 'Sekretaris'}</p>
      </div>

      <div class="signature-box">
        <p>${profil.namaKota}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="font-weight: bold;">Ketua TP PKK ${profil.namaRT}</p>
        <div class="signature-space"></div>
        <p class="signature-name">${profil.namaKetua}</p>
      </div>
    </div>
  `;

  executePrint(fullHtml, `Buku ${bukuId} PKK - ${profil.namaRT}`);
}

/**
 * Print Matriks Iuran Bulanan PKK
 */
export function printMatriksIuran(rekapIuran: RekapIuranAnggota[], tahun: number, profil: ProfilPKKRT): void {
  const bulanList = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  let grandTotalNominal = 0;

  const rowsHtml = rekapIuran.map((r, idx) => {
    const paidEntries = Object.values(r.bulan || {}).filter(v => v?.lunas);
    const totalLunas = paidEntries.length;
    const totalNominal = paidEntries.reduce((sum, v) => sum + (v?.nominal || profil.iuranBulananNominal || 10000), 0);
    grandTotalNominal += totalNominal;

    return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${r.namaAnggota}</strong>${r.dasawisma ? `<br/><span style="font-size: 8pt; color: #64748b;">${r.dasawisma}</span>` : ''}</td>
        <td>${r.jabatan}</td>
        ${bulanList.map((_, bIdx) => {
          const bKey = bIdx + 1;
          const status = r.bulan?.[bKey]?.lunas;
          return `
            <td style="text-align: center; font-size: 8.5pt;">
              ${status ? '<span style="color: #047857; font-weight: bold;">✓</span>' : '<span style="color: #94a3b8;">-</span>'}
            </td>
          `;
        }).join('')}
        <td style="text-align: center; font-weight: bold; background: #f1f5f9;">${totalLunas} Bln</td>
        <td style="text-align: right; font-weight: bold; color: #047857;">Rp ${totalNominal.toLocaleString('id-ID')}</td>
      </tr>
    `;
  }).join('');

  const bodyHtml = `
    ${getKopSuratHTML(profil)}
    <div class="doc-title">REKAPITULASI MATRIKS IURAN ANGGOTA TP PKK TAHUN ${tahun}</div>
    <div class="doc-subtitle">${profil.namaRT} / ${profil.namaRW}, KELURAHAN ${profil.namaKelurahan.toUpperCase()}</div>

    <table class="pkk-table">
      <thead>
        <tr>
          <th style="width: 25px;">No</th>
          <th>Nama Anggota</th>
          <th>Jabatan</th>
          ${bulanList.map(b => `<th style="width: 28px;">${b}</th>`).join('')}
          <th>Lunas</th>
          <th>Total Dibayar</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; font-weight: bold;">
          <td colspan="16" style="text-align: right;">TOTAL PENERIMAAN IURAN TERKUMPUL :</td>
          <td style="text-align: right; color: #047857;">Rp ${grandTotalNominal.toLocaleString('id-ID')}</td>
        </tr>
      </tfoot>
    </table>

    <div class="signature-section">
      <div class="signature-box">
        <p>Bendahara TP PKK,</p>
        <div class="signature-space"></div>
        <p class="signature-name">${profil.namaBendahara || 'Bendahara'}</p>
      </div>

      <div class="signature-box">
        <p>${profil.namaKota}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="font-weight: bold;">Ketua TP PKK ${profil.namaRT}</p>
        <div class="signature-space"></div>
        <p class="signature-name">${profil.namaKetua}</p>
      </div>
    </div>
  `;

  executePrint(bodyHtml, `Matriks Iuran PKK Tahun ${tahun}`);
}

/**
 * Print Laporan Tahunan Lengkap TP PKK
 */
export function printLaporanLengkap(
  profil: ProfilPKKRT,
  data: {
    anggotaList: AnggotaPKK[];
    keluargaList: any[];
    transaksiList: TransaksiKas[];
    kegiatanList: KegiatanPKK[];
    togaList?: any[];
  },
  tahun: number = new Date().getFullYear()
): void {
  const totalAnggota = data.anggotaList.length;
  const totalKK = data.keluargaList.length;
  const totalKegiatan = data.kegiatanList.length;
  const totalKasMasuk = data.transaksiList.filter(t => t.jenis === 'Masuk').reduce((s, c) => s + c.jumlah, 0);
  const totalKasKeluar = data.transaksiList.filter(t => t.jenis === 'Keluar').reduce((s, c) => s + c.jumlah, 0);
  const saldoKas = totalKasMasuk - totalKasKeluar;

  const bodyHtml = `
    ${getKopSuratHTML(profil)}

    <div class="doc-title">LAPORAN TAHUNAN TIM PENGGERAK PKK ${profil.namaRT} / ${profil.namaRW}</div>
    <div class="doc-subtitle">PERIODE TAHUN ${tahun} - KELURAHAN ${profil.namaKelurahan.toUpperCase()}</div>

    <h3 style="font-size: 12pt; font-weight: bold; border-bottom: 1.5px solid #047857; padding-bottom: 4px; margin-top: 20px;">
      BAB I : PENDAHULUAN & GAMBARAN UMUM
    </h3>
    <p style="text-align: justify; font-size: 11pt; line-height: 1.6;">
      Laporan Tahunan ini disusun sebagai bentuk pertanggungjawaban pelaksanaan 10 Program Pokok PKK di lingkungan ${profil.namaRT}, ${profil.namaRW}, Kelurahan ${profil.namaKelurahan}, Kecamatan ${profil.namaKecamatan}, ${profil.namaKota}. Seluruh kegiatan berorientasi pada peningkatan kesejahteraan, ketahanan keluarga, dan keasrian lingkungan warga.
    </p>

    <h3 style="font-size: 12pt; font-weight: bold; border-bottom: 1.5px solid #047857; padding-bottom: 4px; margin-top: 20px;">
      BAB II : REKAPITULASI DATA KELEMBAGAAN & ANGGOTA
    </h3>
    <table class="pkk-table">
      <tr>
        <td style="width: 40%;"><strong>Jumlah Pengurus & Kader TP PKK</strong></td>
        <td>${totalAnggota} Orang</td>
      </tr>
      <tr>
        <td><strong>Jumlah Kepala Keluarga (KK) Terdata Dasawisma</strong></td>
        <td>${totalKK} KK</td>
      </tr>
      <tr>
        <td><strong>Jumlah Pokja Aktif</strong></td>
        <td>4 Kelompok Kerja (Pokja I s/d Pokja IV) & Sekretariat</td>
      </tr>
    </table>

    <h3 style="font-size: 12pt; font-weight: bold; border-bottom: 1.5px solid #047857; padding-bottom: 4px; margin-top: 20px;">
      BAB III : REALISASI KEGIATAN & 10 PROGRAM POKOK PKK
    </h3>
    <p style="font-size: 11pt;">Total kegiatan yang berhasil terlaksana sebanyak <strong>${totalKegiatan} Agenda</strong> meliputi:</p>
    <table class="pkk-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Nama Agenda Kegiatan</th>
          <th>Pokja</th>
          <th>Tanggal Pelaksanaan</th>
          <th>Jumlah Peserta</th>
        </tr>
      </thead>
      <tbody>
        ${data.kegiatanList.slice(0, 8).map((k, i) => `
          <tr>
            <td style="text-align: center;">${i + 1}</td>
            <td><strong>${k.namaKegiatan}</strong></td>
            <td>${k.pokjaPengampu}</td>
            <td>${k.tanggal}</td>
            <td style="text-align: center;">${k.pesertaHadir} Orang</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h3 style="font-size: 12pt; font-weight: bold; border-bottom: 1.5px solid #047857; padding-bottom: 4px; margin-top: 20px;">
      BAB IV : LAPORAN KEUANGAN & KAS TP PKK
    </h3>
    <table class="pkk-table">
      <tr>
        <td><strong>Total Penerimaan Kas (Debet)</strong></td>
        <td style="color: #047857; font-weight: bold; text-align: right;">Rp ${totalKasMasuk.toLocaleString('id-ID')}</td>
      </tr>
      <tr>
        <td><strong>Total Pengeluaran Kas (Kredit)</strong></td>
        <td style="color: #b91c1c; font-weight: bold; text-align: right;">Rp ${totalKasKeluar.toLocaleString('id-ID')}</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td><strong>Sisa Saldo Kas Bersih</strong></td>
        <td style="color: #0369a1; font-weight: bold; text-align: right; font-size: 12pt;">Rp ${saldoKas.toLocaleString('id-ID')}</td>
      </tr>
    </table>

    <h3 style="font-size: 12pt; font-weight: bold; border-bottom: 1.5px solid #047857; padding-bottom: 4px; margin-top: 20px;">
      BAB V : PENUTUP
    </h3>
    <p style="text-align: justify; font-size: 11pt; line-height: 1.6;">
      Demikian Laporan Tahunan TP PKK ${profil.namaRT} ini disampaikan. Semoga menjadi bahan evaluasi dan perbaikan pelaksanaan program pemberdayaan keluarga di masa mendatang.
    </p>

    <div class="signature-section">
      <div class="signature-box">
        <p>Mengetahui,</p>
        <p style="font-weight: bold;">Sekretaris TP PKK ${profil.namaRT}</p>
        <div class="signature-space"></div>
        <p class="signature-name">${profil.namaSekretaris || 'Sekretaris'}</p>
      </div>

      <div class="signature-box">
        <p>${profil.namaKota}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="font-weight: bold;">Ketua TP PKK ${profil.namaRT}</p>
        <div class="signature-space"></div>
        <p class="signature-name">${profil.namaKetua}</p>
      </div>
    </div>
  `;

  executePrint(bodyHtml, `Laporan Tahunan TP PKK ${profil.namaRT}`);
}

/**
 * Print Laporan Pertanggungjawaban (LPJ) Keuangan & Buku Kas Umum
 */
export function printLaporanKeuangan(
  profil: ProfilPKKRT,
  transaksiList: TransaksiKas[],
  rekapIuran: RekapIuranAnggota[],
  options?: { tahun?: number | string; bulan?: number | string; kategori?: string }
): void {
  const tahun = options?.tahun || new Date().getFullYear();
  const bulanOpt = options?.bulan && options.bulan !== 'Semua' ? Number(options.bulan) : null;
  const BULAN_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const filteredKas = (transaksiList || []).filter((t) => {
    if (!t.tanggal) return true;
    const d = new Date(t.tanggal);
    const matchYear = !isNaN(d.getFullYear()) ? d.getFullYear() === Number(tahun) : true;
    const matchMonth = bulanOpt !== null ? d.getMonth() + 1 === bulanOpt : true;
    const matchKat = options?.kategori && options.kategori !== 'Semua' ? t.kategori === options.kategori : true;
    return matchYear && matchMonth && matchKat;
  });

  const totalMasuk = filteredKas.filter((t) => t.jenis === 'Masuk').reduce((acc, t) => acc + (t.jumlah || 0), 0);
  const totalKeluar = filteredKas.filter((t) => t.jenis === 'Keluar').reduce((acc, t) => acc + (t.jumlah || 0), 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  const katMasukMap: { [k: string]: number } = {};
  const katKeluarMap: { [k: string]: number } = {};
  filteredKas.forEach((t) => {
    if (t.jenis === 'Masuk') {
      katMasukMap[t.kategori] = (katMasukMap[t.kategori] || 0) + (t.jumlah || 0);
    } else {
      katKeluarMap[t.kategori] = (katKeluarMap[t.kategori] || 0) + (t.jumlah || 0);
    }
  });

  let saldoRun = 0;
  const kasRowsHtml = filteredKas.map((t, idx) => {
    const masuk = t.jenis === 'Masuk' ? t.jumlah : 0;
    const keluar = t.jenis === 'Keluar' ? t.jumlah : 0;
    saldoRun += masuk - keluar;
    return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${t.tanggal || '-'}</td>
        <td style="text-align: center;">${t.noBukti || '-'}</td>
        <td><strong>${t.kategori}</strong>: ${t.keterangan}</td>
        <td style="text-align: right; color: #047857;">${masuk > 0 ? `Rp ${masuk.toLocaleString('id-ID')}` : '-'}</td>
        <td style="text-align: right; color: #b91c1c;">${keluar > 0 ? `Rp ${keluar.toLocaleString('id-ID')}` : '-'}</td>
        <td style="text-align: right; font-weight: bold;">Rp ${saldoRun.toLocaleString('id-ID')}</td>
      </tr>
    `;
  }).join('');

  const periodeStr = bulanOpt ? `Bulan ${BULAN_NAMES[bulanOpt - 1]} ${tahun}` : `Tahun Anggaran ${tahun}`;

  const bodyHtml = `
    ${getKopSuratHTML(profil)}

    <div class="doc-title">LAPORAN PERTANGGUNGJAWABAN (LPJ) KEUANGAN TP PKK</div>
    <div class="doc-subtitle">PERIODE: ${periodeStr.toUpperCase()} - ${profil.namaRT.toUpperCase()} / ${profil.namaRW.toUpperCase()}</div>

    <h3 style="font-size: 11pt; font-weight: bold; border-bottom: 1.5px solid #047857; padding-bottom: 3px; margin-top: 15px;">
      I. IKHTISAR POSISI ARUS KAS & SALDO KEUANGAN
    </h3>
    <table class="pkk-table">
      <thead>
        <tr>
          <th style="width: 40px;">No</th>
          <th>Uraian Pos Keuangan</th>
          <th style="text-align: right; width: 160px;">Jumlah Nominal</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1</td>
          <td><strong>Total Penerimaan / Pemasukan Kas (Debit)</strong></td>
          <td style="text-align: right; font-weight: bold; color: #047857;">Rp ${totalMasuk.toLocaleString('id-ID')}</td>
          <td>Iuran, Swadaya, Bantuan, Hasil UP2K</td>
        </tr>
        <tr>
          <td style="text-align: center;">2</td>
          <td><strong>Total Pengeluaran / Belanja Kas (Kredit)</strong></td>
          <td style="text-align: right; font-weight: bold; color: #b91c1c;">Rp ${totalKeluar.toLocaleString('id-ID')}</td>
          <td>Kegiatan Pokja, Operasional, PMT, TOGA, ATK</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="text-align: center;">3</td>
          <td><strong>Surplus / (Defisit) Periode Berjalan</strong></td>
          <td style="text-align: right; font-weight: bold; color: #0369a1;">Rp ${saldoAkhir.toLocaleString('id-ID')}</td>
          <td>${saldoAkhir >= 0 ? 'Surplus Anggaran' : 'Defisit Anggaran'}</td>
        </tr>
        <tr style="background: #f0fdf4; font-weight: bold;">
          <td style="text-align: center;">4</td>
          <td><strong>Sisa Saldo Kas Riil Tersedia di Bendahara</strong></td>
          <td style="text-align: right; font-size: 11pt; color: #047857;">Rp ${saldoAkhir.toLocaleString('id-ID')}</td>
          <td>Kas Tunai TP PKK ${profil.namaRT}</td>
        </tr>
      </tbody>
    </table>

    <h3 style="font-size: 11pt; font-weight: bold; border-bottom: 1.5px solid #047857; padding-bottom: 3px; margin-top: 18px;">
      II. REKAPITULASI REALISASI ANGGARAN MENURUT POS KATEGORI
    </h3>
    <table class="pkk-table">
      <thead>
        <tr>
          <th style="width: 40px;">No</th>
          <th>Pos Kategori Kas</th>
          <th style="text-align: right; width: 140px;">Realisasi Nominal</th>
          <th style="text-align: center; width: 80px;">Porsi (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background: #f0fdf4; font-weight: bold;">
          <td colspan="4" style="color: #047857;">A. PENERIMAAN / PEMASUKAN KAS (DEBET)</td>
        </tr>
        ${Object.keys(katMasukMap).length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #64748b;">Belum ada catatan penerimaan.</td></tr>' : 
          Object.entries(katMasukMap).map(([kat, val], i) => `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td>${kat}</td>
              <td style="text-align: right;">Rp ${val.toLocaleString('id-ID')}</td>
              <td style="text-align: center;">${totalMasuk > 0 ? ((val / totalMasuk) * 100).toFixed(1) : 0}%</td>
            </tr>
          `).join('')
        }
        <tr style="font-weight: bold;">
          <td colspan="2" style="text-align: right;">Subtotal Penerimaan:</td>
          <td style="text-align: right; color: #047857;">Rp ${totalMasuk.toLocaleString('id-ID')}</td>
          <td style="text-align: center;">100%</td>
        </tr>

        <tr style="background: #fff1f2; font-weight: bold;">
          <td colspan="4" style="color: #b91c1c;">B. PENGELUARAN / BELANJA OPERASIONAL (KREDIT)</td>
        </tr>
        ${Object.keys(katKeluarMap).length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #64748b;">Belum ada catatan pengeluaran.</td></tr>' : 
          Object.entries(katKeluarMap).map(([kat, val], i) => `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td>${kat}</td>
              <td style="text-align: right;">Rp ${val.toLocaleString('id-ID')}</td>
              <td style="text-align: center;">${totalKeluar > 0 ? ((val / totalKeluar) * 100).toFixed(1) : 0}%</td>
            </tr>
          `).join('')
        }
        <tr style="font-weight: bold;">
          <td colspan="2" style="text-align: right;">Subtotal Pengeluaran:</td>
          <td style="text-align: right; color: #b91c1c;">Rp ${totalKeluar.toLocaleString('id-ID')}</td>
          <td style="text-align: center;">100%</td>
        </tr>
      </tbody>
    </table>

    <h3 style="font-size: 11pt; font-weight: bold; border-bottom: 1.5px solid #047857; padding-bottom: 3px; margin-top: 18px;">
      III. BUKU KAS UMUM (BUKU III ADMINISTRASI PKK)
    </h3>
    <table class="pkk-table">
      <thead>
        <tr>
          <th style="width: 30px;">No</th>
          <th style="width: 80px;">Tanggal</th>
          <th style="width: 70px;">No Bukti</th>
          <th>Uraian / Transaksi</th>
          <th style="text-align: right; width: 95px;">Masuk (Rp)</th>
          <th style="text-align: right; width: 95px;">Keluar (Rp)</th>
          <th style="text-align: right; width: 100px;">Saldo (Rp)</th>
        </tr>
      </thead>
      <tbody>
        ${kasRowsHtml || '<tr><td colspan="7" style="text-align: center; color: #64748b;">Belum ada data transaksi kas.</td></tr>'}
      </tbody>
    </table>

    <div class="signature-section" style="margin-top: 25px;">
      <div class="signature-box">
        <p>Mengetahui,</p>
        <p style="font-weight: bold;">Ketua RW ${profil.namaRW.replace(/[^0-9]/g, '') || '01'}</p>
        <div class="signature-space"></div>
        <p class="signature-name">( ........................................ )</p>
      </div>

      <div class="signature-box">
        <p>Diperiksa oleh,</p>
        <p style="font-weight: bold;">Bendahara TP PKK ${profil.namaRT}</p>
        <div class="signature-space"></div>
        <p class="signature-name">${profil.namaBendahara || 'Bendahara'}</p>
      </div>

      <div class="signature-box">
        <p>${profil.namaKota}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="font-weight: bold;">Ketua TP PKK ${profil.namaRT}</p>
        <div class="signature-space"></div>
        <p class="signature-name">${profil.namaKetua}</p>
      </div>
    </div>
  `;

  executePrint(bodyHtml, `LPJ Keuangan TP PKK ${profil.namaRT} ${tahun}`);
}

/**
 * Print Kwitansi Bukti Pembayaran Iuran Anggota PKK
 */
export function printKwitansiIuran(
  payload: KwitansiIuranPayload,
  profil: ProfilPKKRT
): void {
  const {
    nomorKwitansi,
    tanggalBayar,
    namaPenerimaIuran,
    noHp,
    jabatan = 'Anggota PKK',
    dasawisma,
    bulanList,
    tahun,
    nominalPerBulan,
    totalNominal,
    metodeBayar,
    catatan,
    namaBendahara,
  } = payload;

  const sortedBulan = [...bulanList].sort((a, b) => a - b);
  const daftarBulanNama = sortedBulan.map((b) => NAMA_BULAN_LENGKAP[b - 1]).join(', ');
  const terbilang = angkaKeTerbilang(totalNominal);

  const tglFormatted = (() => {
    try {
      const dt = new Date(tanggalBayar);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {}
    return tanggalBayar;
  })();

  const bodyHtml = `
    <div style="border: 2px solid #047857; padding: 24px; border-radius: 12px; background: #ffffff; position: relative;">
      <div style="position: absolute; right: 28px; top: 28px; border: 2px solid #047857; padding: 4px 14px; border-radius: 8px; font-weight: bold; color: #047857; font-size: 11pt; text-transform: uppercase; transform: rotate(-5deg); opacity: 0.85;">
        LUNAS
      </div>

      ${getKopSuratHTML(profil)}

      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 15pt; font-weight: bold; text-decoration: underline; color: #0f172a; letter-spacing: 1px;">
          KWITANSI PEMBAYARAN IURAN PKK
        </div>
        <div style="font-size: 10pt; color: #475569; margin-top: 3px;">
          Nomor Bukti: <strong>${nomorKwitansi}</strong>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11pt; line-height: 1.8; margin-bottom: 20px;">
        <tbody>
          <tr>
            <td style="width: 190px; vertical-align: top; color: #475569;">Telah Diterima Dari</td>
            <td style="width: 15px; vertical-align: top;">:</td>
            <td style="font-weight: bold; font-size: 12pt; color: #0f172a;">Ibu ${namaPenerimaIuran}</td>
          </tr>
          <tr>
            <td style="vertical-align: top; color: #475569;">Status / Kelompok</td>
            <td style="vertical-align: top;">:</td>
            <td>${jabatan}${dasawisma ? ` &mdash; <strong>${dasawisma}</strong>` : ''}</td>
          </tr>
          ${noHp ? `
          <tr>
            <td style="vertical-align: top; color: #475569;">No. Handphone / WhatsApp</td>
            <td style="vertical-align: top;">:</td>
            <td>${noHp}</td>
          </tr>` : ''}
          <tr>
            <td style="vertical-align: top; color: #475569;">Untuk Pembayaran</td>
            <td style="vertical-align: top;">:</td>
            <td><strong>Iuran Rutin Anggota PKK Tahun ${tahun}</strong></td>
          </tr>
          <tr>
            <td style="vertical-align: top; color: #475569;">Rincian Bulan</td>
            <td style="vertical-align: top;">:</td>
            <td><strong>Bulan ${daftarBulanNama} (${sortedBulan.length} Bulan)</strong> @ Rp ${nominalPerBulan.toLocaleString('id-ID')}</td>
          </tr>
          <tr>
            <td style="vertical-align: top; color: #475569;">Metode Pembayaran</td>
            <td style="vertical-align: top;">:</td>
            <td>${metodeBayar}</td>
          </tr>
          ${catatan ? `
          <tr>
            <td style="vertical-align: top; color: #475569;">Keterangan / Catatan</td>
            <td style="vertical-align: top;">:</td>
            <td style="font-style: italic;">${catatan}</td>
          </tr>` : ''}
          <tr>
            <td style="vertical-align: top; color: #475569; padding-top: 10px;">Terbilang</td>
            <td style="vertical-align: top; padding-top: 10px;">:</td>
            <td style="font-weight: bold; font-style: italic; background: #f8fafc; padding: 6px 10px; border-left: 3px solid #047857;">
              "${terbilang}"
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Kotak Jumlah Nominal & Tanda Tangan -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
        <div style="border: 2px solid #047857; background: #f0fdf4; padding: 12px 24px; border-radius: 8px; display: inline-block;">
          <div style="font-size: 10pt; color: #047857; font-weight: bold; text-transform: uppercase;">Jumlah Nominal Lunas</div>
          <div style="font-size: 16pt; font-weight: 800; color: #047857;">
            Rp ${totalNominal.toLocaleString('id-ID')}
          </div>
        </div>

        <div style="text-align: center; width: 220px;">
          <div style="font-size: 10pt; color: #475569;">
            ${profil.namaKota}, ${tglFormatted}
          </div>
          <div style="font-weight: bold; font-size: 10.5pt; margin-top: 2px;">
            Bendahara TP PKK ${profil.namaRT}
          </div>
          <div style="height: 60px;"></div>
          <div style="font-weight: bold; text-decoration: underline; font-size: 11pt;">
            ${namaBendahara || profil.namaBendahara || 'Bendahara'}
          </div>
        </div>
      </div>
    </div>
  `;

  executePrint(bodyHtml, `Kwitansi Iuran - ${namaPenerimaIuran} - ${nomorKwitansi}`);
}


