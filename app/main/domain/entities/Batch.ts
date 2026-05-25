import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn 
} from 'typeorm';
import { Item } from './Item';
import { Party } from './Party';
import { MaterialTransaction } from './MaterialTransaction';

export enum BatchStatus {
  RECEIVED = 'RECEIVED',
  WIP = 'WIP',
  COMPLETED = 'COMPLETED',
  SOLD = 'SOLD',
}

@Entity()
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  batchNo!: string;

  @Column()
  itemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'itemId' })
  item!: Item;

  @Column()
  sourcePartyId!: string;

  @ManyToOne(() => Party)
  @JoinColumn({ name: 'sourcePartyId' })
  party!: Party;

  @OneToMany(() => MaterialTransaction, (transaction) => transaction.batch)
  transactions!: MaterialTransaction[];

  @Column({
    type: 'varchar',
    default: BatchStatus.RECEIVED
  })
  status!: BatchStatus;

  @Column({ name: 'assignedTo', nullable: true })
  assignedTo!: string | null;

  @ManyToOne(() => Party)
  @JoinColumn({ name: 'assignedTo' })
  assignedParty?: Party;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
