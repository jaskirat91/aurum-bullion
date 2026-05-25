import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('company_settings')
export class CompanySetting {
  @PrimaryColumn({ type: 'varchar', default: 'current' })
  id: string = 'current';

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  financialYear!: string;

  @Column({ type: 'varchar', nullable: true })
  address?: string;

  @Column({ type: 'varchar', nullable: true })
  gstNumber?: string;

  @Column({ type: 'varchar', nullable: false })
  defaultGoldLedgerId!: string;

  @Column({ type: 'varchar', nullable: false })
  defaultCashLedgerId!: string;

  @Column({ type: 'varchar', nullable: true })
  syslog?: string;

  @Column({ type: 'varchar', nullable: true })
  syslogex?: string;

  @UpdateDateColumn()
  updatedAt!: Date;
}
