/**
 * Helper untuk membersihkan teks naskah surat PKK
 * Menghilangkan duplikasi Kop Surat, Nomor, Sifat, Lampiran, dan Perihal di bagian atas,
 * serta menghilangkan duplikasi blok tanda tangan di bagian bawah,
 * sehingga naskah murni berupa batang tubuh surat Block Style (Bentuk Lurus).
 */
export function cleanSuratBodyText(rawContent: string): string {
  if (!rawContent) return '';

  let text = rawContent.trim();

  // Bersihkan blok kode markdown jika ada
  text = text.replace(/^```[a-zA-Z]*\n?/g, '').replace(/\n?```$/g, '').trim();

  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  let reachedBody = false;

  // 1. FILTER BAGIAN ATAS (KOP, METADATA, HEADER)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();

    // Jika belum masuk ke batang tubuh surat (sebelum "Kepada Yth" atau "Dengan hormat")
    if (!reachedBody) {
      // Periksa apakah ini tanda masuk ke batang tubuh surat
      if (
        upper.startsWith('KEPADA YTH') ||
        upper.startsWith('KEPADA:') ||
        upper.startsWith('DENGAN HORMAT') ||
        upper.startsWith('ASSALAMU\'ALAIKUM') ||
        upper.startsWith('ASSALAMUALAIKUM')
      ) {
        reachedBody = true;
        cleanedLines.push(line);
        continue;
      }

      // Abaikan baris Kop Surat & Metadata di bagian atas
      if (
        upper.includes('PEMBERDAYAAN DAN KESEJAHTERAAN KELUARGA') ||
        upper.includes('TIM PENGGERAK PKK') ||
        upper.includes('KELURAHAN ') ||
        upper.includes('KECAMATAN ') ||
        upper.includes('SEKRETARIAT:') ||
        upper.includes('SEKRETARIAT :') ||
        trimmed.startsWith('===') ||
        trimmed.startsWith('---') ||
        trimmed.startsWith('***') ||
        upper.startsWith('NOMOR') ||
        upper.startsWith('SIFAT') ||
        upper.startsWith('LAMPIRAN') ||
        upper.startsWith('PERIHAL') ||
        upper.startsWith('HAL :') ||
        upper.startsWith('HAL:') ||
        // Deteksi baris tanggal di pojok kanan atas sebelum naskah, misal "Bandung, 24 Mei 2026"
        /^[A-Za-z\s]+,\s+\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(trimmed)
      ) {
        continue; // Lewati baris duplikat kop & header
      }

      // Jika baris kosong sebelum masuk body, abaikan
      if (!trimmed) {
        continue;
      }

      // Jika baris lain yang tidak cocok pola kop, anggap sudah masuk naskah
      reachedBody = true;
      cleanedLines.push(line);
    } else {
      // Sudah dalam body surat
      cleanedLines.push(line);
    }
  }

  // 2. FILTER BAGIAN BAWAH (BLOK TANDA TANGAN DUPLIKAT)
  // Bersihkan tanda tangan teks di akhir jika ada, karena sistem sudah menyediakan blok tanda tangan resmi Ketua & Sekretaris
  while (cleanedLines.length > 0) {
    const lastLine = cleanedLines[cleanedLines.length - 1].trim();
    const upperLast = lastLine.toUpperCase();

    if (!lastLine) {
      cleanedLines.pop();
      continue;
    }

    if (
      upperLast.includes('TIM PENGGERAK PKK') ||
      upperLast.startsWith('KETUA') ||
      upperLast.startsWith('SEKRETARIS') ||
      upperLast.startsWith('MENGETAHUI') ||
      upperLast.startsWith('NY.') ||
      upperLast.startsWith('( NY.') ||
      upperLast.startsWith('(NY.') ||
      upperLast.startsWith('(') && upperLast.endsWith(')') ||
      /^[A-Za-z\s]+,\s+\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(lastLine) ||
      upperLast === 'KETUA,' ||
      upperLast === 'SEKRETARIS,' ||
      upperLast.includes('KETUA TP PKK') ||
      upperLast.includes('SEKRETARIS TP PKK')
    ) {
      cleanedLines.pop();
      continue;
    }

    break;
  }

  // Jika seluruh teks terfilter (misal format tidak lazim), kembalikan teks asli yang ditrim
  const result = cleanedLines.join('\n').trim();
  return result || text;
}

export interface SuratKeyValueItem {
  label: string;
  value: string;
}

export interface SuratNumberedItem {
  num: string;
  text: string;
}

export type SuratBodyBlock =
  | { type: 'paragraph'; text: string; isBold?: boolean }
  | { type: 'key-value'; items: SuratKeyValueItem[] }
  | { type: 'numbered-list'; items: SuratNumberedItem[] }
  | { type: 'list'; items: string[] };

const KNOWN_EVENT_KEYS = [
  'hari / tanggal',
  'hari/tanggal',
  'hari, tanggal',
  'hari',
  'tanggal',
  'waktu',
  'pukul',
  'jam',
  'tempat',
  'lokasi',
  'acara',
  'agenda',
  'kegiatan',
  'pakaian',
  'dress code',
  'dresscode',
  'catatan',
  'keterangan',
  'peserta',
  'sasaran',
  'narasumber',
  'pemateri',
  'biaya',
  'kontribusi',
];

/**
 * Memeriksa apakah suatu baris merupakan pasangan label : nilai (misal: Hari / Tanggal : Rabu, 20 Mei 2026)
 */
function parseKeyValueLine(line: string): { label: string; value: string } | null {
  const colonIdx = line.indexOf(':');
  if (colonIdx <= 0) return null;

  const rawLabel = line.substring(0, colonIdx).replace(/^[ \t*#-]+/, '').trim();
  const rawValue = line.substring(colonIdx + 1).trim();

  if (!rawLabel || rawLabel.length > 32) return null;

  const lowerLabel = rawLabel.toLowerCase();
  const isKnown = KNOWN_EVENT_KEYS.some((k) => lowerLabel === k || lowerLabel.startsWith(k));

  // Jika bukan kata kunci umum, pastikan formatnya adalah label pendek tanpa titik akhir kalimat
  if (!isKnown) {
    if (rawLabel.includes('.') || rawLabel.includes(';') || rawLabel.split(/\s+/).length > 4) {
      return null;
    }
  }

  return { label: rawLabel, value: rawValue };
}

/**
 * Memeriksa apakah suatu baris merupakan item berpenomoran (misal: 1. Pembukaan, 2) Sambutan, a. Penutup)
 */
function parseNumberedLine(line: string): { num: string; text: string } | null {
  const trimmed = line.trim();
  // Cocokkan format nomor: 1., 2., 10., 1), a., b., A., B.
  const match = trimmed.match(/^(\d+[\.\)]|[a-zA-Z][\.\)])\s+(.+)$/);
  if (match) {
    const num = match[1].endsWith('.') || match[1].endsWith(')') ? match[1] : `${match[1]}.`;
    return { num, text: match[2].trim() };
  }
  return null;
}

/**
 * Memeriksa apakah suatu baris merupakan item bullet/daftar tak berurut (- item, * item, • item)
 */
function parseBulletLine(line: string): string | null {
  const trimmed = line.trim();
  const match = trimmed.match(/^[-*•]\s+(.+)$/);
  if (match && !trimmed.startsWith('***') && !trimmed.startsWith('---')) {
    return match[1].trim();
  }
  return null;
}

/**
 * Memecah teks batang tubuh surat menjadi blok-blok terstruktur (paragraf, detail acara ber-titik dua lurus, susunan agenda nomor urut ke bawah, list)
 */
export function parseSuratBodyBlocks(rawContent: string): SuratBodyBlock[] {
  const cleanText = cleanSuratBodyText(rawContent);
  if (!cleanText) return [];

  // Pra-proses: Jika ada kalimat intro yang memuat daftar nomor inline (contoh: "Susunan acara: 1. Doa 2. Sambutan 3. Penutup")
  // pecah menjadi baris tersendiri agar menjadi daftar bernomor urut ke bawah yang rapi
  const expandedLines: string[] = [];
  const rawLines = cleanText.split('\n');

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      expandedLines.push('');
      continue;
    }

    // Deteksi jika satu baris mengandung multiple nomor inline misal "1. ... 2. ... 3. ..."
    if (/\b1[\.\)]\s+.+\s+\b2[\.\)]\s+/.test(trimmed)) {
      const parts = trimmed.split(/(?=\b\d+[\.\)]\s+)/);
      for (const part of parts) {
        if (part.trim()) {
          expandedLines.push(part.trim());
        }
      }
    } else {
      expandedLines.push(line);
    }
  }

  const blocks: SuratBodyBlock[] = [];

  let currentKvItems: SuratKeyValueItem[] = [];
  let currentNumberedItems: SuratNumberedItem[] = [];
  let currentBulletItems: string[] = [];
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(' ').trim();
      if (text) {
        const isBold = text.startsWith('#') || (text.length > 3 && text.length < 60 && text === text.toUpperCase());
        const clean = text.replace(/^[#* \t]+|[#* \t]+$/g, '').trim();
        blocks.push({ type: 'paragraph', text: clean, isBold });
      }
      currentParagraphLines = [];
    }
  };

  const flushKv = () => {
    if (currentKvItems.length > 0) {
      blocks.push({ type: 'key-value', items: [...currentKvItems] });
      currentKvItems = [];
    }
  };

  const flushNumbered = () => {
    if (currentNumberedItems.length > 0) {
      blocks.push({ type: 'numbered-list', items: [...currentNumberedItems] });
      currentNumberedItems = [];
    }
  };

  const flushBullet = () => {
    if (currentBulletItems.length > 0) {
      blocks.push({ type: 'list', items: [...currentBulletItems] });
      currentBulletItems = [];
    }
  };

  const flushAll = () => {
    flushParagraph();
    flushKv();
    flushNumbered();
    flushBullet();
  };

  for (let i = 0; i < expandedLines.length; i++) {
    const rawLine = expandedLines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    // 1. Cek apakah baris Key-Value (Label : Nilai)
    const kv = parseKeyValueLine(trimmed);
    if (kv) {
      flushParagraph();
      flushNumbered();
      flushBullet();
      currentKvItems.push(kv);
      continue;
    }

    // 2. Cek apakah baris Penomoran Urut Agenda (1. ..., 2. ...)
    const numItem = parseNumberedLine(trimmed);
    if (numItem) {
      flushParagraph();
      flushKv();
      flushBullet();
      currentNumberedItems.push(numItem);
      continue;
    }

    // 3. Cek apakah baris Bullet list (- ..., • ...)
    const bulletText = parseBulletLine(trimmed);
    if (bulletText) {
      flushParagraph();
      flushKv();
      flushNumbered();
      currentBulletItems.push(bulletText);
      continue;
    }

    // 4. Baris Paragraf Biasa / Heading Intro Agenda
    // Jika baris ini adalah header pengantar agenda (contoh: "Agenda Pembahasan:", "Adapun susunan acara sebagai berikut:")
    // flush paragraf sebelumnya agar header terisolasi rapi sebelum daftar nomor dimulai
    const lowerTrimmed = trimmed.toLowerCase();
    const isIntroHeading =
      lowerTrimmed.endsWith(':') ||
      lowerTrimmed.startsWith('agenda') ||
      lowerTrimmed.startsWith('susunan acara') ||
      lowerTrimmed.startsWith('catatan:');

    if (isIntroHeading) {
      flushAll();
      currentParagraphLines.push(trimmed);
      flushParagraph();
    } else {
      flushKv();
      flushNumbered();
      flushBullet();
      currentParagraphLines.push(trimmed);
    }
  }

  flushAll();

  return blocks;
}

/**
 * Menyelaraskan tanda titik dua (:) dan susunan agenda bernomor urut ke bawah untuk teks polos / WhatsApp / Salin Naskah
 */
export function alignColonsInPlainText(rawContent: string): string {
  const blocks = parseSuratBodyBlocks(rawContent);
  if (blocks.length === 0) return cleanSuratBodyText(rawContent);

  const formattedBlocks: string[] = [];

  for (const block of blocks) {
    if (block.type === 'paragraph') {
      formattedBlocks.push(block.text);
    } else if (block.type === 'key-value') {
      // Cari panjang label terpanjang dalam kelompok ini
      const maxLabelLen = Math.max(...block.items.map((it) => it.label.length), 14);
      const kvLines = block.items.map((it) => {
        const paddedLabel = it.label.padEnd(maxLabelLen, ' ');
        return `${paddedLabel} : ${it.value}`;
      });
      formattedBlocks.push(kvLines.join('\n'));
    } else if (block.type === 'numbered-list') {
      const numLines = block.items.map((it, idx) => {
        const num = it.num.endsWith('.') || it.num.endsWith(')') ? it.num : `${idx + 1}.`;
        return `${num} ${it.text}`;
      });
      formattedBlocks.push(numLines.join('\n'));
    } else if (block.type === 'list') {
      formattedBlocks.push(block.items.map((it) => `• ${it}`).join('\n'));
    }
  }

  return formattedBlocks.join('\n\n');
}

/**
 * Mengonversi naskah surat menjadi HTML yang rapi dengan tabel berkolom untuk titik dua sejajar vertikal dan nomor agenda urut ke bawah
 */
export function formatSuratBodyHtml(rawContent: string): string {
  const blocks = parseSuratBodyBlocks(rawContent);
  if (blocks.length === 0) return '';

  return blocks
    .map((block) => {
      if (block.type === 'paragraph') {
        const weight = block.isBold ? 'font-weight: bold;' : '';
        return `<p style="text-align: justify; text-align-last: left; margin: 8px 0; line-height: 1.6; ${weight}">${block.text}</p>`;
      }
      if (block.type === 'key-value') {
        const rows = block.items
          .map(
            (item) => `
          <tr>
            <td style="white-space: nowrap; padding-right: 12px; vertical-align: top; font-weight: 500;">${item.label}</td>
            <td style="width: 15px; text-align: center; vertical-align: top; font-weight: bold;">:</td>
            <td style="vertical-align: top; text-align: justify; text-align-last: left;">${item.value}</td>
          </tr>`
          )
          .join('');

        return `<table style="border-collapse: collapse; margin: 10px 0 10px 15px; font-size: 11pt; line-height: 1.6; width: auto;">
          <tbody>${rows}</tbody>
        </table>`;
      }
      if (block.type === 'numbered-list') {
        const rows = block.items
          .map(
            (item, idx) => `
          <tr>
            <td style="width: 26px; vertical-align: top; font-weight: bold; padding-right: 6px; white-space: nowrap;">${item.num || `${idx + 1}.`}</td>
            <td style="vertical-align: top; text-align: justify; text-align-last: left; line-height: 1.6;">${item.text}</td>
          </tr>`
          )
          .join('');

        return `<table style="border-collapse: collapse; margin: 6px 0 10px 18px; font-size: 11pt; line-height: 1.6; width: 100%; max-width: 600px;">
          <tbody>${rows}</tbody>
        </table>`;
      }
      if (block.type === 'list') {
        const rows = block.items
          .map(
            (item) => `
          <tr>
            <td style="width: 18px; vertical-align: top; font-weight: bold; padding-right: 4px;">•</td>
            <td style="vertical-align: top; text-align: justify; text-align-last: left; line-height: 1.6;">${item}</td>
          </tr>`
          )
          .join('');

        return `<table style="border-collapse: collapse; margin: 6px 0 10px 18px; font-size: 11pt; line-height: 1.6; width: auto;">
          <tbody>${rows}</tbody>
        </table>`;
      }
      return '';
    })
    .join('');
}


