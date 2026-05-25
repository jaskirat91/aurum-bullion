import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { CashVoucher } from '../../domain/entities/CashVoucher';
import { Account } from '../../domain/entities/Account';

export interface CreateCashVoucherDTO {
  type: 'Receipt' | 'Payment';
  partyAccountId: string;
  accountId: string;
  entryDate: string;
  receiptAmount?: number;
  paymentAmount?: number;
  goldRate?: number;
  goldWeight?: number;
  narration?: string;
  remarks?: string;
  remarksTime?: string;
  action: 'DRAFT' | 'POST';
}

export class CreateCashVoucherUseCase {
  async execute(dto: CreateCashVoucherDTO): Promise<{ success: boolean; voucherNo: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Validate party account
      const accountRepo = em.getRepository(Account);
      const partyAccount = await accountRepo.findOne({
        where: { id: dto.partyAccountId },
      });
      if (!partyAccount) throw new Error('Party account not found. Please select a valid party.');

      Account.validateFreezeDate(partyAccount, dto.entryDate);

      // 2. Validate cash/bank account
      if (!dto.accountId) {
        throw new Error('Cash/Bank account is required.');
      }
      const cashAccount = await accountRepo.findOne({ where: { id: dto.accountId } });
      if (!cashAccount) throw new Error('Cash/Bank account not found. Please re-select the account.');

      Account.validateFreezeDate(cashAccount, dto.entryDate);

      // 3. Generate unique Voucher No
      const voucherRepo = em.getRepository(Voucher);
      const vType = dto.type === 'Receipt' ? VoucherType.RECEIPT : VoucherType.PAYMENT;
      
      const lastVoucher = await voucherRepo.findOne({
        where: { type: vType },
        order: { createdAt: 'DESC' }
      });

      let nextNum = 1;
      if (lastVoucher && lastVoucher.voucherNo) {
        const parts = lastVoucher.voucherNo.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }

      const year = new Date(dto.entryDate).getFullYear();
      const prefix = dto.type === 'Receipt' ? 'RCT' : 'PMT';
      const voucherNo = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
      let narration = '';
      if (dto.narration?.trim()) {
        narration = dto.narration.trim();
      } else {
        narration = `Cash Voucher (${dto.type}) for ${partyAccount.name} \n${dto.type === 'Receipt' ? 'BY' : 'TO'} :`;
        if (dto.type == 'Payment') {
          narration += ` ${dto.paymentAmount || 0} @ ${dto.goldRate || 0}`;
        } else if (dto.type == 'Receipt') {
          narration += ` ${dto.receiptAmount || 0} @ ${dto.goldRate || 0}`;
        }
      }

      // 4. Create Voucher
      const voucher = new Voucher();
      voucher.type = vType;
      voucher.entryDate = dto.entryDate;
      voucher.voucherNo = voucherNo;
      voucher.narration = narration;
      voucher.status = dto.action === 'POST' ? VoucherStatus.POSTED : VoucherStatus.DRAFT;
      const savedVoucher = await em.save(voucher);

      // 5. Create CashVoucher header
      const cashVoucher = new CashVoucher();
      cashVoucher.voucherId = savedVoucher.id;
      cashVoucher.partyAccountId = dto.partyAccountId;
      cashVoucher.accountId = dto.accountId;
      cashVoucher.receiptAmount = dto.receiptAmount;
      cashVoucher.paymentAmount = dto.paymentAmount;
      cashVoucher.goldRate = dto.goldRate;
      cashVoucher.goldWeight = dto.goldWeight;
      cashVoucher.remarks = dto.remarks;
      cashVoucher.remarksTime = dto.remarksTime;
      await em.save(cashVoucher);

      // 6. Create Journal + Ledger entries only when posting
      if (dto.action === 'POST') {
        const je = new JournalEntry();
        je.voucherId = savedVoucher.id;
        je.entryDate = dto.entryDate;
        je.narration = savedVoucher.narration;
        je.sourceReference = savedVoucher.id;
        je.status = JournalEntryStatus.POSTED;

        const entries: LedgerEntry[] = [];
        const cashAmount = dto.type === 'Receipt' ? dto.receiptAmount || 0 : dto.paymentAmount || 0;
        const goldWeight = dto.goldWeight || 0;

        if (cashAmount > 0) {
          if (dto.type === 'Receipt') {
            // Receipt: Dr Cash, Cr Party
            const cashDr = new LedgerEntry();
            cashDr.accountId = dto.accountId;
            cashDr.debitAmount = cashAmount;
            cashDr.creditAmount = 0;
            cashDr.narration = `Cash received - ${voucherNo}`;
            cashDr.journalEntry = je;
            entries.push(cashDr);

            const partyCr = new LedgerEntry();
            partyCr.accountId = partyAccount.id;
            partyCr.debitAmount = 0;
            partyCr.creditAmount = cashAmount;
            partyCr.narration = `Cash received - ${voucherNo}`;
            partyCr.journalEntry = je;
            entries.push(partyCr);
          } else {
            // Payment: Dr Party, Cr Cash
            const partyDr = new LedgerEntry();
            partyDr.accountId = partyAccount.id;
            partyDr.debitAmount = cashAmount;
            partyDr.creditAmount = 0;
            partyDr.narration = `Cash paid - ${voucherNo}`;
            partyDr.journalEntry = je;
            entries.push(partyDr);

            const cashCr = new LedgerEntry();
            cashCr.accountId = dto.accountId;
            cashCr.debitAmount = 0;
            cashCr.creditAmount = cashAmount;
            cashCr.narration = `Cash paid - ${voucherNo}`;
            cashCr.journalEntry = je;
            entries.push(cashCr);
          }
        }

        je.ledgerEntries = entries;
        await em.save(je);
      }

      return { success: true, voucherNo };
    });
  }
}
