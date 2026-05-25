import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Party } from './Party';

@Entity('party_aliases')
export class PartyAlias {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  partyId!: string;

  @ManyToOne(() => Party)
  @JoinColumn({ name: 'partyId' })
  party!: Party;

  @Column({ type: 'varchar', unique: true })
  alias!: string;

  @Column({ type: 'integer', default: 100 })
  confidenceScore!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
