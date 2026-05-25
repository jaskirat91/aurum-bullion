import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum AccountSubtype {
  INVENTORY = 'INVENTORY',
  PAYABLE = 'PAYABLE',
  RECEIVABLE = 'RECEIVABLE',
  CASH = 'CASH',
  BANK = 'BANK',
  GOLD = 'GOLD',
  LABOUR = 'LABOUR',
}

export enum NormalBalance {
  DR = 'DR',
  CR = 'CR',
}

export enum AccountUnit {
  INR = 'INR',
  GRAM = 'GRAM',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', nullable: true })
  parent_id?: string;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Account;

  @Column({ type: 'varchar' })
  account_type!: AccountType;

  @Column({ type: 'varchar', nullable: true })
  account_subtype?: AccountSubtype;

  @Column({ type: 'boolean', default: false })
  is_group!: boolean;

  @Column({ type: 'varchar' })
  normal_balance!: NormalBalance;

  @Column({ type: 'varchar', default: AccountUnit.INR })
  unit!: AccountUnit;

  @Column({ type: 'boolean', default: true })
  allow_direct_posting!: boolean;

  @Column({ type: 'boolean', default: false })
  is_system!: boolean;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'varchar', nullable: true })
  account_freeze_date?: string;

  static validateFreezeDate(account: Account, entryDate: string) {
    if (account.account_freeze_date && entryDate <= account.account_freeze_date) {
      throw new Error(
        `Account "${account.name}" is frozen until ${account.account_freeze_date}. Entry date ${entryDate} is not allowed.`,
      );
    }
  }

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at?: Date;
}
