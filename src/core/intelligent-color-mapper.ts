import { ParsedSection } from './parser.js';
import { ContentClassification } from './content-classifier.js';

export class IntelligentColorMapper {
  
  private readonly colorPriority = [
    'pastel-pink',     // Highest priority - urgent/critical
    'pastel-orange',   // High priority - warnings
    'pastel-yellow',   // Questions/unknowns
    'pastel-green',    // Solutions/success
    'pastel-mint',     // New/fresh ideas
    'pastel-purple',   // References/sources
    'pastel-lavender', // Technical/creative
    'pastel-blue',     // Information (default)
    'pastel-sky',      // Context/background
    'pastel-peach',    // Personal/subjective
    'pastel-rose',     // Emotional
    'pastel-lime',     // Experimental
    'pastel-coral',    // Connections
    'pastel-lilac',    // Abstract/theoretical
    'pastel-cream',    // Documentation
    'pastel-gray'      // Lowest priority - archived
  ];
  
  assignColor(
    section: ParsedSection,
    classification: ContentClassification,
    parentColor?: string
  ): string {
    
    const colorScores: Record<string, number> = {};
    
    // Initialize all colors with base score
    this.colorPriority.forEach((color, index) => {
      colorScores[color] = this.colorPriority.length - index;
    });
    
    // Analyze sentiment for color adjustment
    this.adjustForSentiment(colorScores, classification.sentiment);
    
    // Analyze content type
    this.adjustForContentType(colorScores, classification);
    
    // Analyze category
    this.adjustForCategory(colorScores, classification.category);
    
    // Check for specific keywords
    this.adjustForKeywords(colorScores, section, classification);
    
    // Consider hierarchical position
    this.adjustForHierarchy(colorScores, section, parentColor);
    
    // Find color with highest score
    let bestColor = 'pastel-blue';
    let highestScore = 0;
    
    for (const [color, score] of Object.entries(colorScores)) {
      if (score > highestScore) {
        highestScore = score;
        bestColor = color;
      }
    }
    
    return bestColor;
  }
  
  private adjustForSentiment(
    scores: Record<string, number>,
    sentiment: ContentClassification['sentiment']
  ): void {
    if (sentiment.score > 5) {
      scores['pastel-green'] += 10;
      scores['pastel-mint'] += 5;
    } else if (sentiment.score < -5) {
      scores['pastel-pink'] += 10;
      scores['pastel-orange'] += 5;
    }
    
    // Check for specific sentiment words
    if (sentiment.negative.some(word => 
      ['error', 'fail', 'critical', 'fatal', 'danger'].includes(word))) {
      scores['pastel-pink'] += 15;
    }
    
    if (sentiment.positive.some(word => 
      ['success', 'complete', 'achieve', 'solve'].includes(word))) {
      scores['pastel-green'] += 15;
    }
  }
  
  private adjustForContentType(
    scores: Record<string, number>,
    classification: ContentClassification
  ): void {
    if (classification.contentType.hasQuestions) {
      scores['pastel-yellow'] += 20;
    }
    
    if (classification.contentType.hasCriticalInfo) {
      scores['pastel-pink'] += 15;
      scores['pastel-orange'] += 10;
    }
    
    if (classification.contentType.hasExamples) {
      scores['pastel-lavender'] += 10;
      scores['pastel-sky'] += 5;
    }
    
    if (classification.contentType.hasDefinitions) {
      scores['pastel-cream'] += 10;
      scores['pastel-blue'] += 5;
    }
    
    if (classification.contentType.hasInstructions) {
      scores['pastel-green'] += 8;
      scores['pastel-mint'] += 5;
    }
  }
  
  private adjustForCategory(
    scores: Record<string, number>,
    category: ContentClassification['category']
  ): void {
    switch (category) {
      case 'technical':
        scores['pastel-lavender'] += 15;
        scores['pastel-purple'] += 10;
        break;
      case 'creative':
        scores['pastel-mint'] += 15;
        scores['pastel-lavender'] += 10;
        scores['pastel-rose'] += 5;
        break;
      case 'analytical':
        scores['pastel-lilac'] += 15;
        scores['pastel-blue'] += 10;
        break;
      case 'reference':
        scores['pastel-purple'] += 20;
        scores['pastel-cream'] += 10;
        break;
      case 'summary':
        scores['pastel-coral'] += 15;
        scores['pastel-sky'] += 10;
        break;
      case 'procedural':
        scores['pastel-green'] += 10;
        scores['pastel-mint'] += 8;
        break;
      case 'conceptual':
        scores['pastel-lilac'] += 12;
        scores['pastel-blue'] += 8;
        break;
      case 'descriptive':
        scores['pastel-blue'] += 10;
        scores['pastel-sky'] += 8;
        break;
    }
  }
  
  private adjustForKeywords(
    scores: Record<string, number>,
    section: ParsedSection,
    classification: ContentClassification
  ): void {
    const content = (section.title + ' ' + section.content).toLowerCase();
    
    // Critical/Urgent keywords
    const criticalKeywords = ['urgent', 'critical', 'important', 'alert', 
                             'warning', 'danger', 'error', 'fail', 'bug'];
    criticalKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        scores['pastel-pink'] += 5;
        scores['pastel-orange'] += 3;
      }
    });
    
    // Success/Solution keywords
    const successKeywords = ['success', 'solution', 'resolve', 'fix', 
                            'complete', 'achieve', 'implement', 'deploy'];
    successKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        scores['pastel-green'] += 5;
      }
    });
    
    // Innovation keywords
    const innovationKeywords = ['new', 'innovative', 'novel', 'breakthrough',
                               'cutting-edge', 'revolutionary', 'transform'];
    innovationKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        scores['pastel-mint'] += 5;
      }
    });
    
    // Experimental keywords
    const experimentalKeywords = ['experimental', 'test', 'beta', 'alpha',
                                 'prototype', 'draft', 'tentative', 'proposed'];
    experimentalKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        scores['pastel-lime'] += 5;
      }
    });
    
    // Check entities for technology mentions
    if (classification.entities.technologies.length > 3) {
      scores['pastel-lavender'] += 8;
    }
  }
  
  private adjustForHierarchy(
    scores: Record<string, number>,
    section: ParsedSection,
    parentColor?: string
  ): void {
    // Root level sections get more prominent colors
    if (section.level === 1) {
      scores['pastel-blue'] += 5;
      scores['pastel-gray'] -= 10; // Avoid gray for main sections
    }
    
    // Deep nested sections tend toward neutral colors
    if (section.level >= 4) {
      scores['pastel-gray'] += 10;
      scores['pastel-cream'] += 5;
      scores['pastel-sky'] += 5;
    }
    
    // Avoid same color as parent for distinction
    if (parentColor && parentColor in scores) {
      scores[parentColor] -= 5;
    }
    
    // Archive old or completed items
    const archiveKeywords = ['deprecated', 'obsolete', 'archived', 'completed', 'done'];
    const content = section.content.toLowerCase();
    if (archiveKeywords.some(keyword => content.includes(keyword))) {
      scores['pastel-gray'] += 20;
    }
  }
}
