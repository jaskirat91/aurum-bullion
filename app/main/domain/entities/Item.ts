import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ItemCategory {
  RAW_MATERIAL = 'RAW_MATERIAL', // Gold Khole, Grain
  FINISHED_GOOD = 'FINISHED_GOOD', // Rings, Chains
  FINDINGS = 'FINDINGS', // Clasps, Hooks
  SERVICES = 'SERVICES', // Repairs, Polishing
}

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar' })
  category!: ItemCategory;

  @Column({ type: 'integer', nullable: true })
  purity!: number; // e.g. 22, 24

  @Column({ type: 'varchar', default: 'GRAM' })
  uom!: 'GRAM' | 'PCS' | 'CARAT';

  @Column({ type: 'varchar', length: 20, nullable: true })
  hsn_code!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
