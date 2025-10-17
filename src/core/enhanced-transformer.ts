import { ParsedSection, MarkdownParser } from './parser.js';
import { NM3Document, NM3Node, NM3Link } from '../models/types.js';
import { ReferenceExtractor, CrossReference } from './reference-extractor.js';
import { ContentClassifier, ContentClassification } from './content-classifier.js';
import { IntelligentShapeAssigner } from './intelligent-shape-assigner.js';
import { IntelligentColorMapper } from './intelligent-color-mapper.js';
import { sanitizeColor, sanitizeShape } from '../constants/validation.js';
import * as GraphModule from 'graphology';
import { dijkstra } from 'graphology-shortest-path';

const Graph = (GraphModule as any).default || GraphModule;

interface EnhancedNode extends NM3Node {
  classification?: ContentClassification;
  references?: string[];
}

export class EnhancedTransformer {
  private parser: MarkdownParser;
  private referenceExtractor: ReferenceExtractor;
  private contentClassifier: ContentClassifier;
  private shapeAssigner: IntelligentShapeAssigner;
  private colorMapper: IntelligentColorMapper;
  private graph: any;
  
  constructor() {
    this.parser = new MarkdownParser();
    this.referenceExtractor = new ReferenceExtractor();
    this.contentClassifier = new ContentClassifier();
    this.shapeAssigner = new IntelligentShapeAssigner();
    this.colorMapper = new IntelligentColorMapper();
    this.graph = new Graph();
  }
  
  async transform(markdown: string): Promise<NM3Document> {
    // Parse markdown
    const sections = this.parser.parse(markdown);
    
    if (sections.length === 0) {
      return this.createEmptyDocument();
    }
    
    // Extract all cross-references
    const references = this.referenceExtractor.extractReferences(sections);
    
    // Classify all sections
    const classifications = new Map<string, ContentClassification>();
    for (const section of sections) {
      const classification = this.contentClassifier.classifySection(section, sections);
      classifications.set(section.id, classification);
    }
    
    // Build graph for relationship analysis
    this.buildGraph(sections, references);
    
    // Create enhanced nodes
    const nodes = this.createEnhancedNodes(sections, classifications, references);
    
    // Create intelligent links
    const links = this.createIntelligentLinks(sections, references);
    
    // Optimize spatial layout
    this.optimizeSpatialLayout(nodes, links);
    
    // Calculate optimal camera
    const camera = this.calculateOptimalCamera(nodes);
    
    return {
      version: "1.0",
      meta: {
        title: sections[0]?.title || "Untitled",
        created: new Date().toISOString(),
        author: "Markdown3D Intelligence Engine",
        tags: this.generateDocumentTags(sections, classifications),
        description: this.generateDocumentDescription(sections, classifications)
      },
      camera,
      nodes,
      links
    };
  }
  
  private buildGraph(sections: ParsedSection[], references: CrossReference[]): void {
    this.graph.clear();
    
    // Add nodes
    sections.forEach(section => {
      this.graph.addNode(section.id, { section });
    });
    
    // Add edges from references
    references.forEach(ref => {
      if (this.graph.hasNode(ref.fromSection) && this.graph.hasNode(ref.toSection)) {
        if (!this.graph.hasEdge(ref.fromSection, ref.toSection)) {
          this.graph.addEdge(ref.fromSection, ref.toSection, {
            weight: ref.confidence,
            type: ref.type
          });
        }
      }
    });
    
    // Add hierarchical edges
    sections.forEach(section => {
      if (section.parent && this.graph.hasNode(section.parent)) {
        if (!this.graph.hasEdge(section.parent, section.id)) {
          this.graph.addEdge(section.parent, section.id, {
            weight: 1.0,
            type: 'hierarchy'
          });
        }
      }
    });
  }
  
  private createEnhancedNodes(
    sections: ParsedSection[],
    classifications: Map<string, ContentClassification>,
    references: CrossReference[]
  ): EnhancedNode[] {
    const nodes: EnhancedNode[] = [];
    const parentColors = new Map<string, string>();
    
    for (const section of sections) {
      const classification = classifications.get(section.id)!;
      
      // Determine parent color for hierarchy consideration
      const parentColor = section.parent ? parentColors.get(section.parent) : undefined;
      
      // Intelligent shape assignment
      const shape = this.shapeAssigner.assignShape(section, classification);
      
      // Intelligent color mapping
      const color = this.colorMapper.assignColor(section, classification, parentColor);
      parentColors.set(section.id, color);
      
      // Calculate importance-based scale
      const scale = this.calculateImportanceScale(section, classification, references);
      
      // Create enhanced node
      const node: EnhancedNode = {
        id: section.id,
        type: sanitizeShape(shape) as any,
        x: 0, // Will be set by spatial optimizer
        y: 0,
        z: 0,
        scale,
        color: sanitizeColor(color),
        title: section.title,
        content: section.originalMarkdown || section.content,
        tags: this.generateNodeTags(section, classification),
        classification // Store for later use
      };
      
      // Add rotation for visual variety on certain shapes
      if (shape === 'pyramid' || shape === 'torus') {
        node['rotation-y'] = Math.random() * Math.PI * 2;
      }
      
      nodes.push(node);
    }
    
    return nodes;
  }
  
  private calculateImportanceScale(
    section: ParsedSection,
    classification: ContentClassification,
    references: CrossReference[]
  ): number {
    let importance = 1.0;
    
    // Level-based importance
    if (section.level === 1) importance += 0.5;
    else if (section.level === 2) importance += 0.3;
    else if (section.level >= 4) importance -= 0.2;
    
    // Content richness
    if (section.metadata.wordCount > 200) importance += 0.3;
    if (section.metadata.hasCode) importance += 0.2;
    if (section.metadata.hasTable) importance += 0.2;
    
    // Classification-based importance
    if (classification.contentType.hasCriticalInfo) importance += 0.4;
    if (classification.category === 'summary' || classification.category === 'analytical') {
      importance += 0.3;
    }
    
    // Reference-based importance (how many other nodes reference this one)
    const incomingRefs = references.filter(r => r.toSection === section.id).length;
    importance += incomingRefs * 0.1;
    
    // Sentiment-based adjustment
    if (Math.abs(classification.sentiment.score) > 10) {
      importance += 0.2; // Strong sentiment = important
    }
    
    // Graph centrality (if node is central to the document structure)
    try {
      const centrality = this.calculateCentrality(section.id);
      importance += centrality * 0.3;
    } catch (e) {
      // Node might not be in graph or no paths
    }
    
    // Clamp to reasonable range
    return Math.min(Math.max(importance, 0.5), 2.5);
  }
  
  private calculateCentrality(nodeId: string): number {
    if (!this.graph.hasNode(nodeId)) return 0;
    
    // Simple centrality: number of shortest paths passing through this node
    let centrality = 0;
    const allNodes = this.graph.nodes();
    
    for (const source of allNodes) {
      for (const target of allNodes) {
        if (source !== target && source !== nodeId && target !== nodeId) {
          try {
            const path = dijkstra.bidirectional(this.graph, source, target);
            if (path && path.includes(nodeId)) {
              centrality++;
            }
          } catch (e) {
            // No path exists
          }
        }
      }
    }
    
    // Normalize
    const maxPossible = (allNodes.length - 1) * (allNodes.length - 2);
    return maxPossible > 0 ? centrality / maxPossible : 0;
  }
  
  private createIntelligentLinks(
    sections: ParsedSection[],
    references: CrossReference[]
  ): NM3Link[] {
    const links: NM3Link[] = [];
    const addedLinks = new Set<string>();
    
    // Create links from cross-references
    for (const ref of references) {
      const linkId = `${ref.fromSection}-${ref.toSection}`;
      if (addedLinks.has(linkId)) continue;
      
      const link: NM3Link = {
        from: ref.fromSection,
        to: ref.toSection,
        type: this.mapReferenceType(ref.type, ref.context),
        thickness: ref.confidence * 2,
        color: this.getLinkColor(ref.type, ref.confidence)
      };
      
      // Add visual properties based on type
      if (ref.type === 'semantic') {
        link.dashed = true;
      } else if (ref.type === 'explicit') {
        link.thickness = 2;
        link.curve = 0.2;
      }
      
      // Animate important connections
      if (ref.confidence > 0.9 && ref.type === 'explicit') {
        link.animated = true;
      }
      
      links.push(link);
      addedLinks.add(linkId);
    }
    
    // Add hierarchical links
    for (const section of sections) {
      if (section.parent) {
        const linkId = `${section.parent}-${section.id}`;
        if (!addedLinks.has(linkId)) {
          links.push({
            from: section.parent,
            to: section.id,
            type: 'contains',
            color: 'pastel-gray',
            thickness: 1.5
          });
          addedLinks.add(linkId);
        }
      }
    }
    
    return links;
  }
  
  private mapReferenceType(
    refType: CrossReference['type'],
    context?: string
  ): NM3Link['type'] {
    if (context) {
      const ctx = context.toLowerCase();
      if (ctx.includes('based on')) return 'derives-from';
      if (ctx.includes('leads to') || ctx.includes('then')) return 'leads-to';
      if (ctx.includes('require')) return 'requires';
      if (ctx.includes('enable')) return 'enables';
      if (ctx.includes('question')) return 'questions';
      if (ctx.includes('answer')) return 'answers';
      if (ctx.includes('example')) return 'exemplifies';
    }
    
    switch (refType) {
      case 'explicit': return 'relates';
      case 'implicit': return 'explores';
      case 'semantic': return 'relates';
      default: return 'relates';
    }
  }
  
  private getLinkColor(type: CrossReference['type'], confidence: number): string {
    if (confidence > 0.9) return 'pastel-blue';
    if (confidence > 0.7) return 'pastel-sky';
    return 'pastel-gray';
  }
  
  private optimizeSpatialLayout(nodes: EnhancedNode[], links: NM3Link[]): void {
    // Group nodes by classification category
    const groups = new Map<string, EnhancedNode[]>();
    
    nodes.forEach(node => {
      const category = node.classification?.category || 'unknown';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(node);
    });
    
    // Position groups in 3D space
    const angleStep = (Math.PI * 2) / groups.size;
    let angle = 0;
    let groupIndex = 0;
    
    for (const [category, groupNodes] of groups) {
      const radius = 15 + groupIndex * 5;
      const centerX = Math.cos(angle) * radius;
      const centerZ = Math.sin(angle) * radius;
      
      // Position nodes within group
      groupNodes.forEach((node, index) => {
        const localAngle = (index / groupNodes.length) * Math.PI * 2;
        const localRadius = Math.min(5, groupNodes.length);
        
        node.x = centerX + Math.cos(localAngle) * localRadius;
        node.z = centerZ + Math.sin(localAngle) * localRadius;
        
        // Y position based on importance
        node.y = (node.scale || 1) * 2 - 2;
        
        // Adjust for hierarchy
        if (node.classification?.category === 'summary' || 
            node.classification?.category === 'analytical') {
          node.y += 3;
        }
      });
      
      angle += angleStep;
      groupIndex++;
    }
    
    // Apply force-directed adjustments to prevent overlaps
    this.applyForceDirectedLayout(nodes, links, 10);
  }
  
  private applyForceDirectedLayout(nodes: EnhancedNode[], links: NM3Link[], iterations: number): void {
    for (let iter = 0; iter < iterations; iter++) {
      // Calculate forces
      const forces = new Map<string, { x: number, y: number, z: number }>();
      
      nodes.forEach(node => {
        forces.set(node.id, { x: 0, y: 0, z: 0 });
      });
      
      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];
          
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const dz = node2.z - node1.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (distance > 0 && distance < 10) {
            const force = 5 / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            const fz = (dz / distance) * force;
            
            forces.get(node1.id)!.x -= fx;
            forces.get(node1.id)!.y -= fy;
            forces.get(node1.id)!.z -= fz;
            forces.get(node2.id)!.x += fx;
            forces.get(node2.id)!.y += fy;
            forces.get(node2.id)!.z += fz;
          }
        }
      }
      
      // Apply forces with damping
      const damping = 0.1;
      nodes.forEach(node => {
        const force = forces.get(node.id)!;
        node.x += force.x * damping;
        node.y += force.y * damping;
        node.z += force.z * damping;
      });
    }
  }
  
  private calculateOptimalCamera(nodes: EnhancedNode[]) {
    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
      minZ = Math.min(minZ, node.z);
      maxZ = Math.max(maxZ, node.z);
    });
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    
    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;
    
    const maxDimension = Math.max(width, height, depth);
    const distance = maxDimension * 1.5;
    
    return {
      "position-x": centerX,
      "position-y": centerY + distance / 3,
      "position-z": centerZ + distance,
      "look-at-x": centerX,
      "look-at-y": centerY,
      "look-at-z": centerZ,
      fov: Math.min(90, Math.max(45, maxDimension * 2))
    };
  }
  
  private generateNodeTags(section: ParsedSection, classification: ContentClassification): string {
    const tags: string[] = [];
    
    tags.push(classification.category);
    if (section.level === 1) tags.push('main');
    if (classification.contentType.hasQuestions) tags.push('question');
    if (classification.contentType.hasCriticalInfo) tags.push('critical');
    if (section.metadata.hasCode) tags.push('code');
    if (section.children.length > 0) tags.push('parent');
    
    return tags.join(',');
  }
  
  private generateDocumentTags(
    sections: ParsedSection[],
    classifications: Map<string, ContentClassification>
  ): string {
    const tags = new Set<string>();
    
    // Add category tags
    classifications.forEach(classification => {
      tags.add(classification.category);
    });
    
    // Add top keywords
    const allKeywords = new Map<string, number>();
    classifications.forEach(classification => {
      classification.keywords.forEach(kw => {
        const current = allKeywords.get(kw.term) || 0;
        allKeywords.set(kw.term, current + kw.weight);
      });
    });
    
    // Sort and take top keywords
    const topKeywords = Array.from(allKeywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);
    
    topKeywords.forEach(kw => tags.add(kw));
    
    return Array.from(tags).join(',');
  }
  
  private generateDocumentDescription(
    sections: ParsedSection[],
    classifications: Map<string, ContentClassification>
  ): string {
    // Generate intelligent summary
    const categories = new Set<string>();
    let totalSentiment = 0;
    let questionCount = 0;
    let criticalCount = 0;
    
    classifications.forEach(c => {
      categories.add(c.category);
      totalSentiment += c.sentiment.score;
      if (c.contentType.hasQuestions) questionCount++;
      if (c.contentType.hasCriticalInfo) criticalCount++;
    });
    
    const avgSentiment = totalSentiment / classifications.size;
    const tone = avgSentiment > 5 ? 'positive' : avgSentiment < -5 ? 'critical' : 'neutral';
    
    return `A ${tone} document with ${sections.length} sections covering ${Array.from(categories).join(', ')}. ` +
           `Contains ${questionCount} exploratory sections and ${criticalCount} critical points.`;
  }
  
  private createEmptyDocument(): NM3Document {
    return {
      version: "1.0",
      meta: {
        title: "Empty Document",
        created: new Date().toISOString(),
        author: "Markdown3D Intelligence Engine",
        tags: "",
        description: "No content to transform"
      },
      camera: {
        "position-x": 0,
        "position-y": 10,
        "position-z": 20,
        "look-at-x": 0,
        "look-at-y": 0,
        "look-at-z": 0,
        fov: 75
      },
      nodes: [],
      links: []
    };
  }
}
