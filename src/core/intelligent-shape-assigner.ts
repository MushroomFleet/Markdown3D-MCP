import { ParsedSection } from './parser.js';
import { ContentClassification } from './content-classifier.js';

export class IntelligentShapeAssigner {
  
  assignShape(
    section: ParsedSection, 
    classification: ContentClassification
  ): 'sphere' | 'cube' | 'cylinder' | 'pyramid' | 'torus' {
    
    // Multi-factor decision system
    const shapeScores = {
      sphere: this.calculateSphereScore(section, classification),
      cube: this.calculateCubeScore(section, classification),
      cylinder: this.calculateCylinderScore(section, classification),
      pyramid: this.calculatePyramidScore(section, classification),
      torus: this.calculateTorusScore(section, classification)
    };
    
    // Find shape with highest score
    let bestShape: 'sphere' | 'cube' | 'cylinder' | 'pyramid' | 'torus' = 'sphere';
    let highestScore = 0;
    
    for (const [shape, score] of Object.entries(shapeScores)) {
      if (score > highestScore) {
        highestScore = score;
        bestShape = shape as typeof bestShape;
      }
    }
    
    return bestShape;
  }
  
  private calculateSphereScore(section: ParsedSection, classification: ContentClassification): number {
    let score = 0;
    
    // Sphere: Atomic concepts, single ideas, questions
    if (classification.contentType.hasQuestions) score += 3;
    if (section.children.length === 0) score += 1;  // Reduced from 2
    if (section.metadata.wordCount < 50) score += 1;  // Reduced from 2
    if (classification.category === 'conceptual') score += 1;  // Reduced from 2
    if (!section.metadata.hasList && !section.metadata.hasTable) score += 0.5;
    if (classification.entities.concepts.length > 0) score += 0.5;
    
    // Keywords that suggest atomic concepts
    const sphereKeywords = ['idea', 'concept', 'thought', 'question', 'hypothesis', 
                           'theory', 'principle', 'belief', 'opinion'];
    const content = section.content.toLowerCase();
    sphereKeywords.forEach(keyword => {
      if (content.includes(keyword)) score += 1;
    });
    
    return score;
  }
  
  private calculateCubeScore(section: ParsedSection, classification: ContentClassification): number {
    let score = 0;
    
    // Cube: Structured information, data, foundations
    if (section.metadata.hasTable) score += 5;  // Increased
    if (section.metadata.hasCode) score += 4;   // Increased
    if (classification.category === 'technical') score += 4;  // Increased
    if (classification.category === 'reference') score += 3;  // Increased
    if (section.children.length > 3) score += 3;  // Increased
    if (classification.entities.technologies.length > 2) score += 2;
    
    // Parent sections with many children
    if (section.children.length > 0) score += 2;
    
    // Structured content patterns
    const structurePatterns = [
      /\d+\.\s+\w+/,  // Numbered lists
      /^[-*]\s+/m,    // Bullet points
      /\|.*\|/,       // Tables
      /\{.*\}/,       // JSON-like structures
      /\[.*\]/        // Arrays
    ];
    
    structurePatterns.forEach(pattern => {
      if (pattern.test(section.content)) score += 1;
    });
    
    return score;
  }
  
  private calculateCylinderScore(section: ParsedSection, classification: ContentClassification): number {
    let score = 0;
    
    // Cylinder: Processes, timelines, sequences
    if (classification.category === 'procedural') score += 5;  // Increased
    if (classification.contentType.hasInstructions) score += 4;  // Increased
    
    // Check title for phase/step indicators
    const titleLower = section.title.toLowerCase();
    if (/phase|step|stage/.test(titleLower)) score += 4;
    
    // Sequential keywords
    const sequentialKeywords = ['step', 'phase', 'stage', 'process', 'timeline', 
                               'procedure', 'workflow', 'pipeline', 'sequence',
                               'first', 'then', 'next', 'finally', 'after'];
    const content = section.content.toLowerCase();
    sequentialKeywords.forEach(keyword => {
      if (content.includes(keyword)) score += 1;
    });
    
    // Check for numbered steps
    if (/step \d+/i.test(content)) score += 3;
    if (/phase \d+/i.test(content)) score += 3;
    
    // Temporal indicators
    const temporalPattern = /\b(\d{4}|\d{1,2}\/\d{1,2}|\w+ \d{1,2}|yesterday|today|tomorrow|week|month|year)\b/gi;
    const temporalMatches = content.match(temporalPattern);
    if (temporalMatches && temporalMatches.length > 2) score += 2;
    
    return score;
  }
  
  private calculatePyramidScore(section: ParsedSection, classification: ContentClassification): number {
    let score = 0;
    
    // Pyramid: Hierarchies, priorities, conclusions
    if (section.metadata.hasList && section.level <= 2) score += 4;  // Increased
    if (classification.category === 'analytical') score += 3;  // Increased
    if (classification.category === 'summary') score += 4;  // Increased
    
    // Hierarchical keywords
    const hierarchyKeywords = ['priority', 'importance', 'hierarchy', 'level',
                              'top', 'bottom', 'high', 'low', 'critical',
                              'major', 'minor', 'primary', 'secondary'];
    const content = section.content.toLowerCase();
    hierarchyKeywords.forEach(keyword => {
      if (content.includes(keyword)) score += 1;
    });
    
    // Check for prioritization patterns
    if (/high.?priority|top.?priority|most important/i.test(content)) score += 3;
    if (/priorit|rank|order of importance/i.test(content)) score += 2;
    
    // Conclusion indicators
    const titleLower = section.title.toLowerCase();
    if (titleLower.includes('conclusion')) score += 5;  // Increased
    if (titleLower.includes('summary')) score += 4;  // Increased
    if (titleLower.includes('overview')) score += 3;
    
    return score;
  }
  
  private calculateTorusScore(section: ParsedSection, classification: ContentClassification): number {
    let score = 0;
    
    // Torus: Cycles, loops, continuous processes
    const cyclicalKeywords = ['cycle', 'loop', 'continuous', 'circular', 'recurring',
                             'feedback', 'iterative', 'repeat', 'rotation', 'spiral',
                             'ongoing', 'perpetual', 'endless'];
    const content = section.content.toLowerCase();
    cyclicalKeywords.forEach(keyword => {
      if (content.includes(keyword)) score += 2;
    });
    
    // Check for cycle descriptions
    if (/feedback loop|continuous improvement|iterative process/i.test(content)) score += 4;
    if (/cycle|lifecycle/i.test(section.title)) score += 3;
    
    // Arrow patterns suggesting cycles
    if (/→.*→.*→/g.test(content) || /->.*->.*->/g.test(content)) score += 2;
    
    return score;
  }
}
