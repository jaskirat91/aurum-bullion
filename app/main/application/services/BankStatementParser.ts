import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import moment from 'moment';

export interface RawTransaction {
  date: string;
  narration: string;
  debit?: number;
  credit?: number;
  amount?: number;
  type?: string; // DR or CR
  balance?: number;
  referenceNo?: string;
  rawRow: any;
}

const HEADER_MAP = {
  DATE: [
    'date',
    'txn date',
    'transaction date',
    'value date',
    'value dt',
    'booking date',
    'date of transaction',
  ],
  NARRATION: [
    'narration',
    'particulars',
    'remarks',
    'description',
    'transaction details',
    'comment',
    'description of transaction',
  ],
  DEBIT: ['debit', 'withdrawal', 'dr', 'debit amount', 'out', 'withdrawals', 'withdrawal amt.'],
  CREDIT: ['credit', 'deposit', 'cr', 'credit amount', 'in', 'deposits', 'deposit amt.'],
  AMOUNT: ['amount', 'transaction amount', 'net amount'],
  DRCR: ['dr/cr', 'type', 'transaction type', 'indicator', 'cr/dr'],
  BALANCE: ['balance', 'running balance', 'closing balance', 'total'],
  REF_NO: [
    'reference no',
    'ref no',
    'ref',
    'chq/ref no',
    'utr',
    'transaction id',
    'reference number',
    'chq/ref no.',
    'chq./ref.no.',
  ],
};

export class BankStatementParser {
  async parse(buffer: Buffer, extension: string): Promise<RawTransaction[]> {
    if (extension === '.csv') {
      return this.parseCSV(buffer.toString());
    } else if (['.xls', '.xlsx'].includes(extension)) {
      return this.parseExcel(buffer);
    }
    throw new Error('Unsupported file format. Please upload .csv, .xls, or .xlsx');
  }

  private parseCSV(content: string): RawTransaction[] {
    const result = Papa.parse(content, { header: true, skipEmptyLines: true });
    return this.normalizeRows(result.data);
  }

  private parseExcel(buffer: Buffer): RawTransaction[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON array of arrays
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Find header row index
    let headerIndex = -1;
    for (let i = 0; i < Math.min(rawRows.length, 30); i++) {
      const row = rawRows[i].filter((c) => c !== null && c !== undefined);
      if (row.length === 0) continue;

      const rowStr = row.map((c) => String(c).toLowerCase());

      let matches: string[] = [];
      Object.entries(HEADER_MAP)
        .filter(([key, value]) => key == 'NARRATION')
        .forEach(([key, synonyms]) => {
          if (rowStr.some((c) => synonyms.some((s) => c.includes(s)))) {
            matches.push(key);
          }
        });

      console.log(
        `Checking row ${i}: matches found for keys: ${matches.join(', ')} | Row data:`,
        rowStr,
      );

      if (matches.length >= 1) {
        // Reduced threshold to 1 for debugging
        headerIndex = i;
        console.log(`Header found at row ${i} with keys: ${matches.join(', ')}`);
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error(
        'Could not find header row in Excel file. Please ensure it contains standard bank columns.',
      );
    }

    // find date row starting and ending index based on the non empty narration column
    let dateRowStartIndex = -1;
    let dateRowEndIndex = -1;
    const mapping = this.detectHeaders(rawRows[headerIndex]);
    console.log(`mapping: ${JSON.stringify(mapping)}`);

    for (let i = headerIndex + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowStr = row.map((c) => String(c).toLowerCase());
      const date = rowStr[0];
      // console.log(`Checking row ${i}: date: ${date}, rowStr: ${JSON.stringify(rowStr)}`);
      if (this.isValidDate(date)) {
        dateRowStartIndex = i;
        break;
      }
    }

    for (let i = dateRowStartIndex + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowStr = row.map((c) => String(c).toLowerCase());
      // const mapping = this.detectHeaders(rawRows[headerIndex + 1]);
      const date = rowStr[0];
      console.log(`Checking end date index ${i}: date: ${date}, rowStr: ${JSON.stringify(rowStr)}`);
      if (this.isValidDate(date)) {
        continue;
      }
      dateRowEndIndex = i - 1;
      break;
    }
    console.log(`Date row start index: ${dateRowStartIndex}`);
    console.log(`Date row end index: ${dateRowEndIndex}`);
    console.log(`Header Index: ${headerIndex}`);
    console.log(`Headers: ${rawRows[headerIndex]}`);
    // Convert from headerIndex onwards into object array
    const headers = rawRows[headerIndex];
    const data = rawRows
      // .slice(headerIndex + 1)
      .slice(dateRowStartIndex, dateRowEndIndex + 1)
      .map((r) => {
        const obj: any = {};
        headers.forEach((h: string, i: number) => {
          if (h) obj[h] = r[i];
        });
        return obj;
      })
      .filter((r) => Object.keys(r).length > 0);

    return this.normalizeRows(data);
  }

  private normalizeRows(rows: any[]): RawTransaction[] {
    if (rows.length === 0) return [];

    const headers = Object.keys(rows[0]);
    const mapping = this.detectHeaders(headers);

    return rows
      .map((row) => {
        const rawDate = this.parseDate(this.getValue(row, mapping.DATE));
        const narration = this.getValue(row, mapping.NARRATION) || '';
        const dr = this.parseFloatValue(this.getValue(row, mapping.DEBIT));
        const cr = this.parseFloatValue(this.getValue(row, mapping.CREDIT));
        const amount = this.parseFloatValue(this.getValue(row, mapping.AMOUNT));

        // Skip rows without at least a date and some amount
        if (!rawDate) return null;

        const normalized: RawTransaction = {
          date: rawDate,
          narration: narration,
          debit: dr,
          credit: cr,
          amount: amount,
          type: dr !== undefined ? 'DR' : 'CR',
          balance: this.parseFloatValue(this.getValue(row, mapping.BALANCE)),
          referenceNo: this.getValue(row, mapping.REF_NO),
          rawRow: row,
        };

        // Ensure amount logic
        if (amount !== undefined) {
          normalized.amount = Math.abs(amount);
          normalized.type = amount < 0 ? 'DR' : 'CR';
        } else if (dr !== undefined) {
          normalized.amount = dr;
          normalized.type = 'DR';
        } else if (cr !== undefined) {
          normalized.amount = cr;
          normalized.type = 'CR';
        }

        return normalized;
      })
      .filter((r) => r !== null) as RawTransaction[];
  }

  private formatRawDate(val: any): string {
    if (val instanceof Date) return val.toISOString().split('T')[0];
    if (typeof val === 'number') {
      // Excel serial date
      const d = new Date((val - 25569) * 86400 * 1000);
      return d.toISOString().split('T')[0];
    }
    // Try to parse string
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  }

  private detectHeaders(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};

    for (const [key, synonyms] of Object.entries(HEADER_MAP)) {
      const found = headers.find((h) => {
        const normalizedH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return synonyms.some((s) => {
          const normalizedS = s.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedH === normalizedS || normalizedH.includes(normalizedS);
        });
      });
      if (found) mapping[key] = found;
    }

    return mapping;
  }

  private getValue(row: any, header?: string): any {
    return header ? row[header] : undefined;
  }

  private parseFloatValue(val: any): number | undefined {
    if (val === undefined || val === null || val === '') return undefined;
    const num = parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? undefined : num;
  }

  private isValidDate(date: any): boolean {
    if (!date) return false;
    // Format of incoming date is DD/MM/YY e.g 25/05/26
    return moment(date, ['DD/MM/YY', 'DD/MM/YYYY'], true).isValid();
  }

  private parseDate(date: any): string {
    return moment(date, ['DD/MM/YY', 'DD/MM/YYYY'], true).toISOString(true).split('T')[0];
  }
}
