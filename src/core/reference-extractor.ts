import { ParsedSection } from './parser.js';

export interface CrossReference {
  fromSection: string;
  toSection: string;
  type: 'explicit' | 'implicit' | 'semantic';
  confidence: number;
  context?: string;
}

export class ReferenceExtractor {
  private references: CrossReference[] = [];
  private sectionMap: Map<string, ParsedSection> = new Map();
  
  extractReferences(sections: ParsedSection[]): CrossReference[] {
    this.references = [];
    this.sectionMap.clear();
    
    // Build section map for lookups
    sections.forEach(s => this.sectionMap.set(s.id, s));
    
    for (const section of sections) {
      // Extract explicit references [[node-id]]
      this.extractExplicitReferences(section);
      
      // Extract implicit references (see also, related to, etc.)
      this.extractImplicitReferences(section);
      
      // Extract semantic references (similar content)
      this.extractSemanticReferences(section, sections);
    }
    
    return this.references;
  }
  
  private extractExplicitReferences(section: ParsedSection): void {
    // Pattern for [[node-id]] or [[node-id|Custom Text]]
    const pattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    let match;
    
    while ((match = pattern.exec(section.originalMarkdown)) !== null) {
      const targetId = this.normalizeId(match[1]);
      const customText = match[2];
      
      // Check if target exists
      if (this.sectionMap.has(targetId)) {
        this.references.push({
          fromSection: section.id,
          toSection: targetId,
          type: 'explicit',
          confidence: 1.0,
          context: customText || undefined
        });
      } else {
        // Try fuzzy matching for close matches
        const bestMatch = this.findBestMatch(targetId);
        if (bestMatch) {
          this.references.push({
            fromSection: section.id,
            toSection: bestMatch,
            type: 'explicit',
            confidence: 0.8,
            context: customText || `Fuzzy match for ${targetId}`
          });
        }
      }
    }
  }
  
  private extractImplicitReferences(section: ParsedSection): void {
    const content = section.content.toLowerCase();
    const patterns = [
      { regex: /see also[:\s]+([^.;,]+)/gi, confidence: 0.9 },
      { regex: /related to[:\s]+([^.;,]+)/gi, confidence: 0.85 },
      { regex: /refer to[:\s]+([^.;,]+)/gi, confidence: 0.9 },
      { regex: /based on[:\s]+([^.;,]+)/gi, confidence: 0.8 },
      { regex: /similar to[:\s]+([^.;,]+)/gi, confidence: 0.75 },
      { regex: /in (?:the )?([^.;,]+) section/gi, confidence: 0.85 },
      { regex: /as mentioned in[:\s]+([^.;,]+)/gi, confidence: 0.9 },
      { regex: /described in[:\s]+([^.;,]+)/gi, confidence: 0.85 },
      { regex: /explained in[:\s]+([^.;,]+)/gi, confidence: 0.85 }
    ];
    
    for (const { regex, confidence } of patterns) {
      let match;
      regex.lastIndex = 0;
      
      while ((match = regex.exec(section.content)) !== null) {
        const referencedText = match[1].trim();
        const targetSection = this.findSectionByText(referencedText);
        
        if (targetSection && targetSection !== section.id) {
          this.references.push({
            fromSection: section.id,
            toSection: targetSection,
            type: 'implicit',
            confidence,
            context: match[0]
          });
        }
      }
    }
  }
  
  private extractSemanticReferences(section: ParsedSection, allSections: ParsedSection[]): void {
    // Skip semantic analysis for very short sections
    if (section.metadata.wordCount < 20) return;
    
    const sectionTerms = this.extractKeyTerms(section.content);
    if (sectionTerms.length < 3) return;
    
    for (const other of allSections) {
      if (other.id === section.id || other.metadata.wordCount < 20) continue;
      
      const otherTerms = this.extractKeyTerms(other.content);
      const similarity = this.calculateJaccardSimilarity(sectionTerms, otherTerms);
      
      if (similarity > 0.3) {
        // Check if not already linked
        const existingLink = this.references.find(
          r => (r.fromSection === section.id && r.toSection === other.id) ||
               (r.fromSection === other.id && r.toSection === section.id)
        );
        
        if (!existingLink) {
          this.references.push({
            fromSection: section.id,
            toSection: other.id,
            type: 'semantic',
            confidence: similarity,
            context: `Semantic similarity: ${(similarity * 100).toFixed(0)}%`
          });
        }
      }
    }
  }
  
  private extractKeyTerms(text: string): string[] {
    // Simple term extraction - can be enhanced with TF-IDF
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    // Remove common stop words
    const stopWords = new Set([
      'this', 'that', 'with', 'from', 'have', 'been', 'their',
      'what', 'which', 'when', 'where', 'will', 'would', 'could',
      'should', 'about', 'after', 'before', 'during', 'through',
      'there', 'these', 'those', 'they', 'then', 'than', 'them'
    ]);
    
    return words.filter(w => !stopWords.has(w));
  }
  
  private calculateJaccardSimilarity(terms1: string[], terms2: string[]): number {
    const set1 = new Set(terms1);
    const set2 = new Set(terms2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
  
  private normalizeId(text: string): string {
    return text.toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }
  
  private findBestMatch(targetId: string): string | null {
    let bestMatch: string | null = null;
    let bestScore = 0;
    
    for (const [id, section] of this.sectionMap) {
      const score = this.calculateSimilarity(targetId, id);
      const titleScore = this.calculateSimilarity(targetId, this.normalizeId(section.title));
      const maxScore = Math.max(score, titleScore);
      
      if (maxScore > bestScore && maxScore > 0.6) {
        bestScore = maxScore;
        bestMatch = id;
      }
    }
    
    return bestMatch;
  }
  
  private findSectionByText(text: string): string | null {
    const normalized = this.normalizeId(text);
    
    // Direct ID match
    if (this.sectionMap.has(normalized)) {
      return normalized;
    }
    
    // Title match
    for (const [id, section] of this.sectionMap) {
      if (this.normalizeId(section.title) === normalized) {
        return id;
      }
      
      // Partial title match
      if (section.title.toLowerCase().includes(text.toLowerCase())) {
        return id;
      }
    }
    
    return null;
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    // Levenshtein distance normalized
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const distance = matrix[len2][len1];
    return 1 - distance / Math.max(len1, len2);
  }
}
