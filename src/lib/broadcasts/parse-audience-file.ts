import * as XLSX from 'xlsx';

export interface ParsedAudienceContact {
  phone: string;
  name?: string;
}

export interface ParseAudienceFileResult {
  contacts: ParsedAudienceContact[];
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  filename: string;
  preview: ParsedAudienceContact[];
}

/** Convert Arabic/Persian digits to Western Arabic digits (0-9). */
export function normalizeDigits(str: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(arabicDigits[i], 'g'), String(i));
    res = res.replace(new RegExp(persianDigits[i], 'g'), String(i));
  }
  return res;
}

/** Sanitize phone number (handles numbers, strings, scientific notation, Arabic digits, formatting) */
export function cleanPhoneNumber(raw: unknown): string {
  if (raw === null || raw === undefined) return '';

  let str = '';

  if (typeof raw === 'number') {
    if (!isNaN(raw) && isFinite(raw)) {
      try {
        str = BigInt(Math.round(raw)).toString();
      } catch {
        str = raw.toLocaleString('fullwide', { useGrouping: false });
      }
    }
  } else {
    str = String(raw).trim();
  }

  // Handle scientific notation string if exported as text (e.g. 9.6477312345E+12)
  if (/[eE][+-]?\d+/.test(str)) {
    const num = Number(str.replace(/[^\d.eE+-]/g, ''));
    if (!isNaN(num) && isFinite(num)) {
      try {
        str = BigInt(Math.round(num)).toString();
      } catch {
        str = num.toLocaleString('fullwide', { useGrouping: false });
      }
    }
  }

  str = normalizeDigits(str);

  // Preserve leading plus if present
  const hasPlus = str.startsWith('+');

  // Remove all non-digits
  str = str.replace(/\D/g, '');

  if (!str) return '';

  return hasPlus ? `+${str}` : str;
}

const PHONE_HEADER_KEYWORDS = [
  'phone',
  'mobile',
  'telephone',
  'tel',
  'whatsapp',
  'number',
  'cell',
  'msisdn',
  'recipient',
  'recipients',
  'هاتف',
  'الهاتف',
  'جوال',
  'الجوال',
  'موبايل',
  'الموبايل',
  'رقم',
  'الرقم',
  'رقم الهاتف',
  'رقم الجوال',
  'تلفون',
  'التلفون',
  'ارقام',
  'الأرقام',
  'الارقام',
];

const NAME_HEADER_KEYWORDS = [
  'name',
  'full_name',
  'fullname',
  'first_name',
  'firstname',
  'contact_name',
  'contact',
  'customer',
  'client',
  'customer_name',
  'client_name',
  'اسم',
  'الاسم',
  'اسم العميل',
  'اسم جهة الاتصال',
  'العميل',
];

function isHeaderMatch(header: string, keywords: string[]): boolean {
  const norm = header.toLowerCase().replace(/[\s_\-:]/g, '');
  return keywords.some((kw) => norm === kw.toLowerCase().replace(/[\s_\-:]/g, ''));
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV file containing contact numbers and optional names.
 */
export async function parseAudienceFile(file: File): Promise<ParseAudienceFileResult> {
  const filename = file.name;
  const isExcel =
    filename.endsWith('.xlsx') ||
    filename.endsWith('.xls') ||
    file.type.includes('spreadsheet') ||
    file.type.includes('excel');

  let rawRows: Record<string, unknown>[] = [];

  if (isExcel) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', raw: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        contacts: [],
        totalRows: 0,
        validCount: 0,
        duplicateCount: 0,
        invalidCount: 0,
        filename,
        preview: [],
      };
    }
    const sheet = workbook.Sheets[firstSheetName];
    // sheet_to_json with raw: true ensures numeric cells are returned as actual numbers, not truncated scientific strings
    rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: true,
    });
  } else {
    // CSV / TXT parsing
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return {
        contacts: [],
        totalRows: 0,
        validCount: 0,
        duplicateCount: 0,
        invalidCount: 0,
        filename,
        preview: [],
      };
    }

    // Determine delimiter
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

    // Parse with XLSX reader for CSV to handle escaping properly
    const workbook = XLSX.read(text, { type: 'string', raw: true });
    const firstSheetName = workbook.SheetNames[0];
    if (firstSheetName) {
      const sheet = workbook.Sheets[firstSheetName];
      rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        raw: true,
      });
    }

    // Fallback if sheet_to_json had no headers (e.g. single column list of numbers)
    if (rawRows.length === 0 && lines.length > 0) {
      for (const line of lines) {
        const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length === 1 && parts[0]) {
          rawRows.push({ phone: parts[0] });
        } else if (parts.length >= 2) {
          rawRows.push({ phone: parts[0], name: parts[1] });
        }
      }
    }
  }

  if (rawRows.length === 0) {
    return {
      contacts: [],
      totalRows: 0,
      validCount: 0,
      duplicateCount: 0,
      invalidCount: 0,
      filename,
      preview: [],
    };
  }

  // Detect phone and name column keys from the first row keys
  const allKeys = Object.keys(rawRows[0] || {});
  let phoneKey = allKeys.find((k) => isHeaderMatch(k, PHONE_HEADER_KEYWORDS));
  let nameKey = allKeys.find((k) => isHeaderMatch(k, NAME_HEADER_KEYWORDS));

  // If no explicit phone header was found, pick the key whose first value resembles a phone number or is the first column
  if (!phoneKey && allKeys.length > 0) {
    // Check which column has numbers
    for (const key of allKeys) {
      const sampleVal = String(rawRows[0][key] || '');
      const cleaned = cleanPhoneNumber(sampleVal);
      if (cleaned.length >= 7) {
        phoneKey = key;
        break;
      }
    }
    // Default to first column if still undefined
    if (!phoneKey) {
      phoneKey = allKeys[0];
    }
  }

  // If nameKey is the same as phoneKey, clear nameKey
  if (nameKey === phoneKey) {
    nameKey = undefined;
  }

  // Process rows
  const seenPhones = new Set<string>();
  const validContacts: ParsedAudienceContact[] = [];
  let duplicateCount = 0;
  let invalidCount = 0;

  for (const row of rawRows) {
    const rawPhone = phoneKey ? row[phoneKey] : '';
    const rawName = nameKey ? row[nameKey] : '';

    const phone = cleanPhoneNumber(rawPhone);
    const name = rawName ? String(rawName).trim() : undefined;

    // A valid international phone number is usually at least 7 digits (e.g. +966...)
    const digitOnlyCount = phone.replace(/\D/g, '').length;
    if (!phone || digitOnlyCount < 6) {
      invalidCount++;
      continue;
    }

    if (seenPhones.has(phone)) {
      duplicateCount++;
      continue;
    }

    seenPhones.add(phone);
    validContacts.push({
      phone,
      name: name || undefined,
    });
  }

  return {
    contacts: validContacts,
    totalRows: rawRows.length,
    validCount: validContacts.length,
    duplicateCount,
    invalidCount,
    filename,
    preview: validContacts.slice(0, 5),
  };
}

/**
 * Helper to generate and download a sample Excel file template.
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    { 'الاسم': 'أحمد محمد', 'رقم الهاتف': '+966501234567' },
    { 'الاسم': 'سارة علي', 'رقم الهاتف': '+966559876543' },
    { 'الاسم': 'خالد عبدالله', 'رقم الهاتف': '+971501234567' },
    { 'الاسم': 'فاطمة حسن', 'رقم الهاتف': '+96599123456' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');

  XLSX.writeFile(workbook, 'audience_template.xlsx');
}
