import { LRUCache } from 'lru-cache';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { ParsedSection } from './parser.js';
import { NM3Document } from '../models/types.js';

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  keys: number;
}

export class CacheManager {
  private parseCache: LRUCache<string, ParsedSection[]>;
  private transformCache: LRUCache<string, NM3Document>;
  private xmlCache: NodeCache;
  private stats: Map<string, { hits: number; misses: number }>;

  constructor() {
    // Parse cache: LRU with 100MB limit
    this.parseCache = new LRUCache({
      max: 100,
      maxSize: 100 * 1024 * 1024, // 100MB
      sizeCalculation: (sections) => {
        return JSON.stringify(sections).length;
      },
      ttl: 1000 * 60 * 30, // 30 minutes
    });

    // Transform cache: LRU with 50MB limit
    this.transformCache = new LRUCache({
      max: 50,
      maxSize: 50 * 1024 * 1024, // 50MB
      sizeCalculation: (doc) => {
        return JSON.stringify(doc).length;
      },
      ttl: 1000 * 60 * 15, // 15 minutes
    });

    // XML cache: Node-cache with TTL
    this.xmlCache = new NodeCache({
      stdTTL: 600, // 10 minutes
      checkperiod: 120, // Check for expired keys every 2 minutes
      maxKeys: 100,
    });

    this.stats = new Map([
      ['parse', { hits: 0, misses: 0 }],
      ['transform', { hits: 0, misses: 0 }],
      ['xml', { hits: 0, misses: 0 }],
    ]);
  }

  // Parse cache methods
  getCachedParse(markdown: string): ParsedSection[] | undefined {
    const key = this.hashMarkdown(markdown);
    const cached = this.parseCache.get(key);
    
    if (cached) {
      this.recordHit('parse');
      return cached;
    }
    
    this.recordMiss('parse');
    return undefined;
  }

  setCachedParse(markdown: string, sections: ParsedSection[]): void {
    const key = this.hashMarkdown(markdown);
    this.parseCache.set(key, sections);
  }

  // Transform cache methods
  getCachedTransform(markdown: string): NM3Document | undefined {
    const key = this.hashMarkdown(markdown);
    const cached = this.transformCache.get(key);
    
    if (cached) {
      this.recordHit('transform');
      return cached;
    }
    
    this.recordMiss('transform');
    return undefined;
  }

  setCachedTransform(markdown: string, document: NM3Document): void {
    const key = this.hashMarkdown(markdown);
    this.transformCache.set(key, document);
  }

  // XML cache methods
  getCachedXML(markdown: string): string | undefined {
    const key = this.hashMarkdown(markdown);
    const cached = this.xmlCache.get<string>(key);
    
    if (cached) {
      this.recordHit('xml');
      return cached;
    }
    
    this.recordMiss('xml');
    return undefined;
  }

  setCachedXML(markdown: string, xml: string): void {
    const key = this.hashMarkdown(markdown);
    this.xmlCache.set(key, xml);
  }

  // Utility methods
  private hashMarkdown(markdown: string): string {
    return crypto.createHash('sha256').update(markdown).digest('hex');
  }

  private recordHit(cache: string): void {
    const stats = this.stats.get(cache)!;
    stats.hits++;
  }

  private recordMiss(cache: string): void {
    const stats = this.stats.get(cache)!;
    stats.misses++;
  }

  getStats(): Record<string, CacheStats> {
    const result: Record<string, CacheStats> = {};

    for (const [cache, stats] of this.stats) {
      const total = stats.hits + stats.misses;
      const hitRate = total > 0 ? stats.hits / total : 0;

      let size = 0;
      let keys = 0;

      if (cache === 'parse') {
        size = this.parseCache.size;
        keys = this.parseCache.size;
      } else if (cache === 'transform') {
        size = this.transformCache.size;
        keys = this.transformCache.size;
      } else if (cache === 'xml') {
        keys = this.xmlCache.keys().length;
        size = 0; // NodeCache doesn't track size
      }

      result[cache] = {
        hits: stats.hits,
        misses: stats.misses,
        hitRate,
        size,
        keys,
      };
    }

    return result;
  }

  clear(): void {
    this.parseCache.clear();
    this.transformCache.clear();
    this.xmlCache.flushAll();
    
    // Reset stats
    for (const stats of this.stats.values()) {
      stats.hits = 0;
      stats.misses = 0;
    }
  }

  clearExpired(): void {
    // LRU caches handle expiry automatically
    // Manually trigger NodeCache cleanup
    this.xmlCache.keys().forEach(key => {
      if (this.xmlCache.getTtl(key)! < Date.now()) {
        this.xmlCache.del(key);
      }
    });
  }
}
