import * as natural from 'natural';
import Sentiment from 'sentiment';
import nlp from 'compromise';
import { ParsedSection } from './parser.js';

export interface ContentClassification {
  category: 'technical' | 'conceptual' | 'procedural' | 'descriptive' | 
            'analytical' | 'creative' | 'reference' | 'summary';
  confidence: number;
  topics: string[];
  sentiment: {
    score: number;
    comparative: number;
    positive: string[];
    negative: string[];
  };
  entities: {
    people: string[];
    places: string[];
    organizations: string[];
    technologies: string[];
    concepts: string[];
  };
  contentType: {
    hasQuestions: boolean;
    hasInstructions: boolean;
    hasExamples: boolean;
    hasDefinitions: boolean;
    hasComparisons: boolean;
    hasCriticalInfo: boolean;
  };
  keywords: Array<{ term: string; weight: number }>;
}

export class ContentClassifier {
  private tfidf: any = null;
  private sentiment: Sentiment;
  private tokenizer: any = null;
  
  constructor() {
    this.sentiment = new Sentiment();
  }
  
  private ensureTfIdf() {
    if (!this.tfidf) {
      const TfIdf = (natural as any).TfIdf || (natural as any).default?.TfIdf;
      this.tfidf = new TfIdf();
    }
  }
  
  classifySection(section: ParsedSection, allSections: ParsedSection[]): ContentClassification {
    const text = `${section.title} ${section.content}`;
    
    return {
      category: this.determineCategory(section),
      confidence: this.calculateConfidence(section),
      topics: this.extractTopics(text),
      sentiment: this.analyzeSentiment(text),
      entities: this.extractEntities(text),
      contentType: this.analyzeContentType(section),
      keywords: this.extractKeywords(text, allSections)
    };
  }
  
  private determineCategory(section: ParsedSection): ContentClassification['category'] {
    const title = section.title.toLowerCase();
    const content = section.content.toLowerCase();
    const combined = title + ' ' + content;
    
    // Pattern-based classification
    const patterns = {
      technical: {
        keywords: ['code', 'algorithm', 'function', 'implementation', 'api', 
                   'configuration', 'syntax', 'debug', 'error', 'bug'],
        weight: section.metadata.hasCode ? 2.0 : 1.0
      },
      procedural: {
        keywords: ['step', 'process', 'procedure', 'method', 'how to', 'guide',
                   'instruction', 'workflow', 'phase', 'stage'],
        weight: section.metadata.hasList ? 1.5 : 1.0
      },
      analytical: {
        keywords: ['analysis', 'analyze', 'comparison', 'evaluate', 'assess',
                   'examine', 'investigate', 'study', 'research'],
        weight: 1.0
      },
      conceptual: {
        keywords: ['concept', 'theory', 'principle', 'philosophy', 'idea',
                   'framework', 'model', 'paradigm', 'approach'],
        weight: 1.0
      },
      descriptive: {
        keywords: ['describe', 'explanation', 'definition', 'overview', 'about',
                   'introduction', 'background', 'context'],
        weight: section.level === 1 ? 1.5 : 1.0
      },
      creative: {
        keywords: ['create', 'design', 'imagine', 'innovate', 'brainstorm',
                   'develop', 'build', 'craft', 'generate'],
        weight: 1.0
      },
      reference: {
        keywords: ['reference', 'documentation', 'specification', 'appendix',
                   'glossary', 'index', 'citation', 'source', 'link'],
        weight: 1.0
      },
      summary: {
        keywords: ['summary', 'conclusion', 'recap', 'overview', 'abstract',
                   'tldr', 'brief', 'synopsis', 'outline'],
        weight: 1.0
      }
    };
    
    const scores: Record<string, number> = {};
    
    for (const [category, config] of Object.entries(patterns)) {
      let score = 0;
      for (const keyword of config.keywords) {
        if (combined.includes(keyword)) {
          score += config.weight;
        }
      }
      scores[category] = score;
    }
    
    // Find category with highest score
    let maxScore = 0;
    let bestCategory: ContentClassification['category'] = 'descriptive';
    
    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category as ContentClassification['category'];
      }
    }
    
    return bestCategory;
  }
  
  private calculateConfidence(section: ParsedSection): number {
    // Base confidence on content richness
    let confidence = 0.5;
    
    if (section.metadata.wordCount > 50) confidence += 0.1;
    if (section.metadata.wordCount > 100) confidence += 0.1;
    if (section.metadata.hasCode) confidence += 0.15;
    if (section.metadata.hasList) confidence += 0.1;
    if (section.metadata.hasTable) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
  
  private extractTopics(text: string): string[] {
    const doc: any = nlp(text);
    const topics: Set<string> = new Set();
    
    // Extract noun phrases
    const nouns = doc.nouns().out('array');
    nouns.forEach((noun: string) => {
      if (noun.length > 2) {
        topics.add(noun.toLowerCase());
      }
    });
    
    // Extract technical terms (CamelCase, snake_case, etc.)
    const technicalPattern = /[A-Z][a-z]+(?:[A-Z][a-z]+)*|[a-z]+_[a-z]+|[a-z]+\-[a-z]+/g;
    const matches = text.match(technicalPattern);
    if (matches) {
      matches.forEach(m => topics.add(m.toLowerCase()));
    }
    
    return Array.from(topics).slice(0, 10);
  }
  
  private analyzeSentiment(text: string): ContentClassification['sentiment'] {
    const result = this.sentiment.analyze(text);
    
    return {
      score: result.score,
      comparative: result.comparative,
      positive: result.positive || [],
      negative: result.negative || []
    };
  }
  
  private extractEntities(text: string): ContentClassification['entities'] {
    const doc: any = nlp(text);
    
    return {
      people: doc.people().out('array') || [],
      places: doc.places().out('array') || [],
      organizations: doc.organizations ? doc.organizations().out('array') : [],
      technologies: this.extractTechnologies(text),
      concepts: this.extractConcepts(text)
    };
  }
  
  private extractTechnologies(text: string): string[] {
    const techPatterns = [
      /\b[A-Z][A-Za-z]+(?:JS|API|SDK|CLI|DB|SQL|XML|JSON|HTML|CSS)\b/g,
      /\b(?:React|Vue|Angular|Node|Docker|Kubernetes|AWS|Azure|GCP)\b/gi,
      /\b(?:Python|JavaScript|TypeScript|Java|C\+\+|Rust|Go)\b/gi,
      /\b(?:AI|ML|NLP|CV|IoT|AR|VR|API)\b/g
    ];
    
    const technologies = new Set<string>();
    
    for (const pattern of techPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(m => technologies.add(m));
      }
    }
    
    return Array.from(technologies);
  }
  
  private extractConcepts(text: string): string[] {
    // Extract abstract concepts and domain terms
    const doc: any = nlp(text);
    const concepts: Set<string> = new Set();
    
    // Look for terms with specific patterns
    const conceptualTerms = doc.match('#Adjective? #Noun+').out('array');
    conceptualTerms.forEach((term: string) => {
      if (term.length > 5 && !term.includes(' the ') && !term.includes(' a ')) {
        concepts.add(term.toLowerCase());
      }
    });
    
    return Array.from(concepts).slice(0, 10);
  }
  
  private analyzeContentType(section: ParsedSection): ContentClassification['contentType'] {
    const content = section.content.toLowerCase();
    const title = section.title.toLowerCase();
    const combined = title + ' ' + content;
    
    return {
      hasQuestions: section.metadata.isQuestion || /\?|how |what |when |where |why /.test(combined),
      hasInstructions: /step \d|first,|then,|finally,|must |should |need to/.test(content),
      hasExamples: /example|for instance|such as|e\.g\.|i\.e\.|like /.test(content),
      hasDefinitions: /defined as|definition|meaning |refers to|is a |are a /.test(content),
      hasComparisons: /compare|versus|vs\.|better than|worse than|similar to|different from/.test(content),
      hasCriticalInfo: /important|critical|warning|danger|alert|note:|must |required/.test(combined)
    };
  }
  
  private extractKeywords(text: string, allSections: ParsedSection[]): Array<{ term: string; weight: number }> {
    // Simplified keyword extraction without TF-IDF for now
    // (Natural library has ES module issues with TfIdf constructor)
    const keywords: Array<{ term: string; weight: number }> = [];
    
    // Simple frequency-based extraction
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    // Convert to keyword array with normalized weights
    const maxFreq = Math.max(...wordFreq.values());
    wordFreq.forEach((freq, term) => {
      keywords.push({
        term,
        weight: freq / maxFreq
      });
    });
    
    return keywords
      .filter(k => k.weight > 0.2) // Only significant terms
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 20);
  }
}
