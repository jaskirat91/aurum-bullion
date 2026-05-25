import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BankStatementImport } from './BankStatementImport';
import { Party } from './Party';

@Entity('bank_statement_rows')
export class BankStatementRow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  importId!: string;

  @ManyToOne(() => BankStatementImport, (importSession) => importSession.rows)
  @JoinColumn({ name: 'importId' })
  import!: BankStatementImport;

  @Column({ type: 'varchar' })
  entryDate!: string;

  @Column({ type: 'varchar', nullable: true })
  entryTime?: string;

  @Column({ type: 'text' })
  narration!: string;

  @Column({ type: 'text', nullable: true })
  normalizedNarration?: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar' }) // DR or CR
  type!: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  balance?: number;

  @Column({ type: 'varchar', nullable: true })
  referenceNo?: string;

  @Column({ type: 'varchar', nullable: true })
  detectedPartyId?: string;

  @ManyToOne(() => Party, { nullable: true })
  @JoinColumn({ name: 'detectedPartyId' })
  detectedParty?: Party;

  @Column({ type: 'integer', default: 0 })
  confidenceScore!: number;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'text', nullable: true })
  rawRowJson?: string;

  @Column({ type: 'varchar', default: 'PENDING' }) // PENDING, VALIDATED, CREATED, SKIPPED
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
