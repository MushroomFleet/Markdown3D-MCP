import { ParsedSection } from './parser.js';
import { NM3Document, NM3Node, NM3Link } from '../models/types.js';
import { sanitizeColor, sanitizeShape } from '../constants/validation.js';

export class SimpleTransformer {
  private nodeMap: Map<string, NM3Node> = new Map();
  
  transform(sections: ParsedSection[]): NM3Document {
    this.nodeMap.clear();
    
    // Create nodes
    const nodes = this.createNodes(sections);
    
    // Create links based on hierarchy and references
    const links = this.createLinks(sections);
    
    // Calculate camera position
    const camera = this.calculateCamera(nodes);
    
    return {
      version: "1.0",
      meta: {
        title: sections[0]?.title || "Untitled",
        created: new Date().toISOString(),
        author: "Markdown3D",
        tags: "markdown,3d,visualization"
      },
      camera,
      nodes,
      links
    };
  }

  private createNodes(sections: ParsedSection[]): NM3Node[] {
    const nodes: NM3Node[] = [];
    const positionMap = this.calculatePositions(sections);
    
    for (const section of sections) {
      const pos = positionMap.get(section.id) || { x: 0, y: 0, z: 0 };
      
      const node: NM3Node = {
        id: section.id,
        type: this.determineShape(section),
        x: pos.x,
        y: pos.y,
        z: pos.z,
        scale: this.calculateScale(section),
        color: sanitizeColor(this.determineColor(section)),
        title: section.title,
        content: section.originalMarkdown || section.content,
        tags: this.generateTags(section)
      };
      
      nodes.push(node);
      this.nodeMap.set(section.id, node);
    }
    
    return nodes;
  }

  private determineShape(section: ParsedSection): "sphere" | "cube" | "cylinder" | "pyramid" | "torus" {
    // Apply semantic rules from Chungus3D
    const title = section.title.toLowerCase();
    const content = section.content.toLowerCase();
    
    // Check for specific patterns
    if (title.includes('process') || title.includes('timeline') || 
        title.includes('step') || title.includes('phase')) {
      return 'cylinder';
    }
    
    if (title.includes('cycle') || title.includes('loop') || 
        title.includes('continuous') || title.includes('feedback')) {
      return 'torus';
    }
    
    if (section.metadata.hasList && section.level <= 2) {
      return 'pyramid'; // Hierarchical lists
    }
    
    if (section.metadata.hasCode || section.metadata.hasTable) {
      return 'cube'; // Structured data
    }
    
    if (section.children.length > 3) {
      return 'cube'; // Parent with many children
    }
    
    return 'sphere'; // Default for atomic concepts
  }

  private determineColor(section: ParsedSection): string {
    const title = section.title.toLowerCase();
    const content = section.content.toLowerCase();
    const combined = title + ' ' + content;
    
    // Semantic color mapping
    if (combined.includes('error') || combined.includes('warning') || 
        combined.includes('critical') || combined.includes('urgent')) {
      return 'pastel-pink';
    }
    
    if (combined.includes('solution') || combined.includes('success') || 
        combined.includes('complete') || combined.includes('done')) {
      return 'pastel-green';
    }
    
    if (section.metadata.isQuestion || combined.includes('how') || 
        combined.includes('why') || combined.includes('what')) {
      return 'pastel-yellow';
    }
    
    if (combined.includes('reference') || combined.includes('source') || 
        combined.includes('citation') || combined.includes('link')) {
      return 'pastel-purple';
    }
    
    if (combined.includes('new') || combined.includes('innovation') || 
        combined.includes('idea') || combined.includes('proposal')) {
      return 'pastel-mint';
    }
    
    if (section.metadata.hasCode) {
      return 'pastel-lavender'; // Technical content
    }
    
    if (section.level === 1) {
      return 'pastel-blue'; // Main sections
    }
    
    if (section.level >= 4) {
      return 'pastel-gray'; // Deep nested content
    }
    
    return 'pastel-blue'; // Default
  }

  private calculateScale(section: ParsedSection): number {
    // Scale based on importance
    const baseScale = 1.0;
    
    // Factors that increase scale
    let scale = baseScale;
    
    if (section.level === 1) scale *= 1.8;
    else if (section.level === 2) scale *= 1.4;
    else if (section.level === 3) scale *= 1.2;
    
    if (section.children.length > 5) scale *= 1.2;
    if (section.metadata.wordCount > 200) scale *= 1.1;
    
    // Limit scale range
    return Math.min(Math.max(scale, 0.7), 2.5);
  }

  private calculatePositions(sections: ParsedSection[]): Map<string, {x: number, y: number, z: number}> {
    const positions = new Map<string, {x: number, y: number, z: number}>();
    
    // Simple grid layout with hierarchy
    const spacing = 5;
    
    // Group by level
    const byLevel = new Map<number, ParsedSection[]>();
    for (const section of sections) {
      if (!byLevel.has(section.level)) {
        byLevel.set(section.level, []);
      }
      byLevel.get(section.level)!.push(section);
    }
    
    // Position each level
    for (const [level, levelSections] of byLevel) {
      const y = (2 - level) * 3; // Higher levels go up
      const count = levelSections.length;
      
      levelSections.forEach((section, index) => {
        const x = (index - count / 2) * spacing;
        const z = -level * 5; // Deeper levels go back
        
        positions.set(section.id, { x, y, z });
      });
    }
    
    return positions;
  }

  private createLinks(sections: ParsedSection[]): NM3Link[] {
    const links: NM3Link[] = [];
    
    // Create hierarchy links
    for (const section of sections) {
      if (section.parent) {
        links.push({
          from: section.parent,
          to: section.id,
          type: 'contains',
          color: 'pastel-gray',
          thickness: 1.5
        });
      }
    }
    
    // Create sequential links for same-level sections
    const byParent = new Map<string | undefined, ParsedSection[]>();
    for (const section of sections) {
      const key = section.parent || 'root';
      if (!byParent.has(key)) {
        byParent.set(key, []);
      }
      byParent.get(key)!.push(section);
    }
    
    for (const siblings of byParent.values()) {
      for (let i = 0; i < siblings.length - 1; i++) {
        links.push({
          from: siblings[i].id,
          to: siblings[i + 1].id,
          type: 'leads-to',
          color: 'pastel-gray',
          thickness: 1
          // Note: dashed property removed as it's not supported in NM3 format
        });
      }
    }
    
    return links;
  }

  private calculateCamera(nodes: NM3Node[]) {
    // Calculate center of all nodes
    let centerX = 0, centerY = 0, centerZ = 0;
    
    if (nodes.length > 0) {
      for (const node of nodes) {
        centerX += node.x;
        centerY += node.y;
        centerZ += node.z;
      }
      centerX /= nodes.length;
      centerY /= nodes.length;
      centerZ /= nodes.length;
    }
    
    // Position camera to see all nodes
    return {
      "position-x": centerX,
      "position-y": centerY + 10,
      "position-z": centerZ + 20,
      "look-at-x": centerX,
      "look-at-y": centerY,
      "look-at-z": centerZ,
      fov: 75
    };
  }

  private generateTags(section: ParsedSection): string {
    const tags: string[] = [];
    
    if (section.level === 1) tags.push('main');
    if (section.metadata.hasCode) tags.push('code');
    if (section.metadata.hasList) tags.push('list');
    if (section.metadata.hasTable) tags.push('table');
    if (section.metadata.isQuestion) tags.push('question');
    if (section.parent) tags.push('child');
    if (section.children.length > 0) tags.push('parent');
    
    return tags.join(',');
  }
}
