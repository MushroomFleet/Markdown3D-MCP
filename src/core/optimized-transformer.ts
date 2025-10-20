import { EnhancedTransformer } from './enhanced-transformer.js';
import { CacheManager } from './cache-manager.js';
import { ChunkedProcessor } from './stream-processor.js';
import { MetricsCollector } from './metrics.js';
import { NM3Document } from '../models/types.js';

export interface TransformOptions {
  useCache?: boolean;
  useStreaming?: boolean;
  chunkSize?: number;
  title?: string;
  author?: string;
}

export class OptimizedTransformer extends EnhancedTransformer {
  private cacheManager: CacheManager;
  private chunkedProcessor: ChunkedProcessor;
  private metrics: MetricsCollector;

  constructor() {
    super();
    this.cacheManager = new CacheManager();
    this.chunkedProcessor = new ChunkedProcessor();
    this.metrics = MetricsCollector.getInstance();
  }

  async transformWithOptimizations(
    markdown: string,
    options: TransformOptions = {}
  ): Promise<NM3Document> {
    const startTime = Date.now();
    let success = false;
    let nodeCount = 0;

    try {
      // Check cache first
      if (options.useCache !== false) {
        const cached = this.cacheManager.getCachedTransform(markdown);
        if (cached) {
          console.error('✨ Cache hit! Returning cached result');
          this.metrics.recordCacheHit('transform');
          
          // Apply overrides
          if (options.title) cached.meta.title = options.title;
          if (options.author) cached.meta.author = options.author;
          
          success = true;
          nodeCount = cached.nodes.length;
          return cached;
        }
        this.metrics.recordCacheMiss('transform');
      }

      // Use streaming for large documents
      let document: NM3Document;
      
      if (options.useStreaming && markdown.length > 50000) {
        console.error('📊 Using streaming processor for large document');
        const sections = await this.chunkedProcessor.processLargeMarkdown(
          markdown,
          options.chunkSize || 1000
        );
        
        // Transform sections to NM3
        document = await this.transformSections(sections);
      } else {
        // Use standard transform
        document = await this.transform(markdown);
      }

      // Apply options
      if (options.title) document.meta.title = options.title;
      if (options.author) document.meta.author = options.author;

      // Cache result
      if (options.useCache !== false) {
        this.cacheManager.setCachedTransform(markdown, document);
      }

      success = true;
      nodeCount = document.nodes.length;
      return document;
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      this.metrics.recordTransform(duration, nodeCount, success);
      console.error(`⏱️  Transform completed in ${duration.toFixed(2)}s`);
    }
  }

  private async transformSections(sections: any[]): Promise<NM3Document> {
    // Build NM3Document directly from sections without re-parsing
    console.error(`   Converting ${sections.length} sections to nodes...`);
    
    // Classify all sections
    const classifications = new Map();
    for (const section of sections) {
      const classification = this.contentClassifier.classifySection(section, sections);
      classifications.set(section.id, classification);
    }
    
    const nodes = sections.map((section, index) => {
      const classification = classifications.get(section.id);
      
      // Assign shape and color using parent class methods
      const shape = this.shapeAssigner.assignShape(section, classification);
      const color = this.colorMapper.assignColor(section, classification);
      
      return {
        id: section.id || `node-${index}`,
        type: shape as any,
        x: 0, // Will be optimized
        y: 0,
        z: 0,
        scale: 1.0,
        color,
        title: section.title,
        content: section.content || '',
        tags: classification.category,
      };
    });
    
    // Create links based on section hierarchy
    console.error(`   Creating hierarchical links...`);
    const links = [];
    const stack: { section: any; nodeIndex: number }[] = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const nodeId = nodes[i].id;
      
      // Find parent (most recent section with lower level)
      while (stack.length > 0 && stack[stack.length - 1].section.level >= section.level) {
        stack.pop();
      }
      
      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        const parentId = nodes[parent.nodeIndex].id;
        links.push({
          from: parentId,
          to: nodeId,
          type: 'contains' as const,
        });
      }
      
      stack.push({ section, nodeIndex: i });
    }
    
    // Apply spatial optimization using parent class method
    console.error(`   Applying spatial optimization...`);
    this.spatialOptimizer.optimize(nodes, links, {
      useForceDirected: nodes.length < 100,
      useCollisionResolution: true,
      maxIterations: 60,
    });
    
    // Calculate camera
    const camera = this.calculateOptimalCamera(nodes);
    
    // Build complete document
    const document: NM3Document = {
      version: "1.0",
      nodes,
      links,
      meta: {
        title: 'Streamed Document',
        author: 'Markdown3D Intelligence Engine',
        created: new Date().toISOString(),
      },
      camera,
    };
    
    console.error(`   ✅ Streaming transform complete: ${nodes.length} nodes, ${links.length} links`);
    return document;
  }

  getCacheStats() {
    return this.cacheManager.getStats();
  }

  clearCache(): void {
    this.cacheManager.clear();
  }
}
