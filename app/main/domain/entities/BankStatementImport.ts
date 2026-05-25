import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BankStatementRow } from './BankStatementRow';

@Entity('bank_statement_imports')
export class BankStatementImport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  bankLedgerAccountId!: string;

  @Column({ type: 'varchar' })
  uploadedFileName!: string;

  @Column({ type: 'varchar' })
  uploadedFileHash!: string;

  @Column({ type: 'varchar' })
  uploadedBy!: string;

  @Column({ type: 'varchar', default: 'PENDING' }) // PENDING, PROCESSED, PARTIAL
  status!: string;

  @OneToMany(() => BankStatementRow, (row) => row.import)
  rows!: BankStatementRow[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
