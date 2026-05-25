import Fuse from 'fuse.js';
import { AppDataSource } from '../../infrastructure/database/data-source';
import { Party } from '../../domain/entities/Party';
import { PartyAlias } from '../../domain/entities/PartyAlias';

export interface DetectionResult {
  partyId?: string;
  confidence: number; // 0 to 100
}

export class PartyDetectionService {
  private fuse: Fuse<any> | null = null;
  private partyMap: Map<string, Party> = new Map();

  async initialize() {
    const partyRepo = AppDataSource.getRepository(Party);
    const parties = await partyRepo.find();
    
    const aliasRepo = AppDataSource.getRepository(PartyAlias);
    const aliases = await aliasRepo.find({ relations: ['party'] });

    const searchData = [
      ...parties.map(p => ({ id: p.id, text: p.name, type: 'PARTY' })),
      ...aliases.map(a => ({ id: a.partyId, text: a.alias, type: 'ALIAS' }))
    ];

    this.fuse = new Fuse(searchData, {
      keys: ['text'],
      threshold: 0.4,
      includeScore: true
    });

    parties.forEach(p => this.partyMap.set(p.id, p));
  }

  detect(narration: string): DetectionResult {
    if (!this.fuse) return { confidence: 0 };

    const cleaned = this.cleanNarration(narration);
    const results = this.fuse.search(cleaned);

    if (results.length > 0) {
      const bestMatch = results[0];
      const confidence = Math.round((1 - (bestMatch.score || 0)) * 100);
      
      // Only return partyId if confidence is high (>= 85)
      if (confidence >= 85) {
        return {
          partyId: bestMatch.item.id,
          confidence
        };
      }
    }

    return { confidence: 0 };
  }

  cleanNarration(narration: string): string {
    return narration
      .toUpperCase()
      .replace(/UPI\//g, '')
      .replace(/NEFT\//g, '')
      .replace(/IMPS\//g, '')
      .replace(/RTGS\//g, '')
      .replace(/TRANSFER\//g, '')
      .replace(/CASH\//g, '')
      .replace(/ATM\//g, '')
      .replace(/[0-9]{10,}/g, '') // Remove long numbers like UTR/Acc No
      .replace(/\s+/g, ' ')
      .trim();
  }

  async learnAlias(partyId: string, narration: string) {
    const cleaned = this.cleanNarration(narration);
    if (!cleaned || cleaned.length < 3) return;

    const aliasRepo = AppDataSource.getRepository(PartyAlias);
    const existing = await aliasRepo.findOne({ where: { alias: cleaned } });

    if (!existing) {
      const alias = new PartyAlias();
      alias.partyId = partyId;
      alias.alias = cleaned;
      alias.confidenceScore = 100;
      await aliasRepo.save(alias);
      
      // Re-initialize to include new alias
      await this.initialize();
    }
  }
}
