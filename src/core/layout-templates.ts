// Layout Templates for Context-Appropriate Spatial Arrangements
// Provides 8 pre-built layouts optimized for different document types

import { NM3Node } from '../models/types.js';

export type LayoutType =
  | 'research-paper'
  | 'documentation'
  | 'project-planning'
  | 'knowledge-base'
  | 'tutorial'
  | 'hierarchical'
  | 'timeline'
  | 'concept-map';

export interface LayoutConfig {
  spacing: number;
  verticalSpread: number;
  horizontalSpread: number;
  depthSpread: number;
}

/**
 * Layout Templates - Pre-built spatial arrangements for common document types
 */
export class LayoutTemplates {
  /**
   * Apply a layout template to nodes
   */
  applyTemplate(
    nodes: NM3Node[],
    layoutType: LayoutType,
    config?: Partial<LayoutConfig>
  ): void {
    const finalConfig: LayoutConfig = {
      spacing: 5,
      verticalSpread: 10,
      horizontalSpread: 15,
      depthSpread: 15,
      ...config,
    };

    switch (layoutType) {
      case 'research-paper':
        this.applyResearchPaperLayout(nodes, finalConfig);
        break;
      case 'documentation':
        this.applyDocumentationLayout(nodes, finalConfig);
        break;
      case 'project-planning':
        this.applyProjectPlanningLayout(nodes, finalConfig);
        break;
      case 'knowledge-base':
        this.applyKnowledgeBaseLayout(nodes, finalConfig);
        break;
      case 'tutorial':
        this.applyTutorialLayout(nodes, finalConfig);
        break;
      case 'hierarchical':
        this.applyHierarchicalLayout(nodes, finalConfig);
        break;
      case 'timeline':
        this.applyTimelineLayout(nodes, finalConfig);
        break;
      case 'concept-map':
        this.applyConceptMapLayout(nodes, finalConfig);
        break;
    }
  }

  /**
   * Research Paper Layout
   * Abstract/intro at top, methods/results side-by-side, conclusion at bottom, references in back
   */
  private applyResearchPaperLayout(nodes: NM3Node[], config: LayoutConfig): void {
    const categories = this.categorizeByTitle(nodes);

    // Position abstract/introduction at top center
    if (categories.intro.length > 0) {
      categories.intro[0].x = 0;
      categories.intro[0].y = config.verticalSpread;
      categories.intro[0].z = 0;
    }

    // Methods on left side
    categories.methods.forEach((node, i) => {
      node.x = -config.horizontalSpread / 2;
      node.y = 0;
      node.z = i * config.spacing;
    });

    // Results on right side
    categories.results.forEach((node, i) => {
      node.x = config.horizontalSpread / 2;
      node.y = 0;
      node.z = i * config.spacing;
    });

    // Conclusion at bottom center
    if (categories.conclusion.length > 0) {
      categories.conclusion[0].x = 0;
      categories.conclusion[0].y = -config.verticalSpread;
      categories.conclusion[0].z = 0;
    }

    // References in background
    categories.references.forEach((node, i) => {
      node.x = (i - categories.references.length / 2) * config.spacing;
      node.y = -config.verticalSpread / 2;
      node.z = -config.depthSpread;
    });

    // Everything else distributed around center
    categories.other.forEach((node, i) => {
      const angle = (i / categories.other.length) * Math.PI * 2;
      const radius = config.horizontalSpread * 0.7;
      node.x = Math.cos(angle) * radius;
      node.z = Math.sin(angle) * radius;
      node.y = 0;
    });
  }

  /**
   * Documentation Layout
   * TOC at front, guides in row, sections in grid, API at back
   */
  private applyDocumentationLayout(nodes: NM3Node[], config: LayoutConfig): void {
    const toc = nodes.filter(n =>
      n.title?.toLowerCase().includes('content') ||
      n.title?.toLowerCase().includes('overview')
    );
    const api = nodes.filter(n =>
      n.title?.toLowerCase().includes('api') ||
      n.title?.toLowerCase().includes('reference')
    );
    const guides = nodes.filter(n =>
      n.title?.toLowerCase().includes('guide') ||
      n.title?.toLowerCase().includes('tutorial')
    );
    const other = nodes.filter(n =>
      !toc.includes(n) && !api.includes(n) && !guides.includes(n)
    );

    // TOC at front center
    if (toc.length > 0) {
      toc[0].x = 0;
      toc[0].y = config.verticalSpread / 2;
      toc[0].z = config.depthSpread;
    }

    // Guides in a row at middle front
    guides.forEach((node, i) => {
      node.x = (i - guides.length / 2) * config.spacing;
      node.y = 0;
      node.z = config.depthSpread / 2;
    });

    // Other sections in grid at center
    const gridSize = Math.ceil(Math.sqrt(other.length));
    other.forEach((node, i) => {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      node.x = (col - gridSize / 2) * config.spacing;
      node.y = 0;
      node.z = (row - gridSize / 2) * config.spacing;
    });

    // API reference at back
    api.forEach((node, i) => {
      node.x = (i - api.length / 2) * config.spacing;
      node.y = -config.verticalSpread / 3;
      node.z = -config.depthSpread;
    });
  }

  /**
   * Project Planning Layout
   * Goals at top, tasks on timeline, completed at bottom, blockers in foreground
   */
  private applyProjectPlanningLayout(nodes: NM3Node[], config: LayoutConfig): void {
    const goals = nodes.filter(n =>
      n.title?.toLowerCase().includes('goal') ||
      n.title?.toLowerCase().includes('objective')
    );
    const tasks = nodes.filter(n =>
      n.title?.toLowerCase().includes('task') ||
      n.title?.toLowerCase().includes('todo')
    );
    const completed = nodes.filter(n =>
      n.title?.toLowerCase().includes('complete') ||
      n.title?.toLowerCase().includes('done')
    );
    const blockers = nodes.filter(n =>
      n.title?.toLowerCase().includes('block') ||
      n.title?.toLowerCase().includes('issue')
    );
    const other = nodes.filter(n =>
      !goals.includes(n) && !tasks.includes(n) &&
      !completed.includes(n) && !blockers.includes(n)
    );

    // Goals at top
    goals.forEach((node, i) => {
      node.x = (i - goals.length / 2) * config.spacing;
      node.y = config.verticalSpread;
      node.z = 0;
    });

    // Tasks spread on timeline (X-axis)
    tasks.forEach((node, i) => {
      node.x = (i - tasks.length / 2) * config.spacing * 1.5;
      node.y = 0;
      node.z = 0;
    });

    // Completed at bottom
    completed.forEach((node, i) => {
      node.x = (i - completed.length / 2) * config.spacing;
      node.y = -config.verticalSpread;
      node.z = config.depthSpread / 2;
    });

    // Blockers in foreground (high visibility)
    blockers.forEach((node, i) => {
      node.x = (i - blockers.length / 2) * config.spacing;
      node.y = config.verticalSpread / 2;
      node.z = config.depthSpread;
    });

    // Other in background
    other.forEach((node, i) => {
      node.x = (i - other.length / 2) * config.spacing;
      node.y = 0;
      node.z = -config.depthSpread / 2;
    });
  }

  /**
   * Knowledge Base Layout
   * Central hub with categories radiating outward in concentric circles
   */
  private applyKnowledgeBaseLayout(nodes: NM3Node[], config: LayoutConfig): void {
    const mainNode = nodes.find(n =>
      n.title?.toLowerCase().includes('index') ||
      n.title?.toLowerCase().includes('home') ||
      n.title?.toLowerCase().includes('main')
    );

    if (mainNode) {
      mainNode.x = 0;
      mainNode.y = 0;
      mainNode.z = 0;
    }

    // Arrange others in concentric circles
    const others = nodes.filter(n => n !== mainNode);

    others.forEach((node, i) => {
      const layer = Math.floor(i / 8) + 1;
      const angleIndex = i % 8;
      const angle = (angleIndex / 8) * Math.PI * 2;
      const radius = layer * config.spacing * 2;

      node.x = Math.cos(angle) * radius;
      node.z = Math.sin(angle) * radius;
      node.y = ((layer % 2) - 0.5) * config.verticalSpread / 3;
    });
  }

  /**
   * Tutorial Layout
   * Linear progression with zigzag pattern
   */
  private applyTutorialLayout(nodes: NM3Node[], config: LayoutConfig): void {
    nodes.forEach((node, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;

      node.x = (col - 1) * config.spacing;
      node.y = config.verticalSpread - (row * config.spacing * 0.5);
      node.z = row * config.spacing;
    });
  }

  /**
   * Hierarchical Layout
   * Tree structure from top to bottom
   */
  private applyHierarchicalLayout(nodes: NM3Node[], config: LayoutConfig): void {
    // Group by level (assuming nodes have level property from parser)
    const levels = new Map<number, NM3Node[]>();
    const maxLevel = 5;

    for (let i = 0; i < maxLevel; i++) {
      levels.set(i, []);
    }

    nodes.forEach((node: any, i) => {
      const level = Math.min((node.level || 1) - 1, maxLevel - 1);
      levels.get(level)!.push(node);
    });

    // Position each level
    levels.forEach((levelNodes, level) => {
      const y = config.verticalSpread - (level * config.verticalSpread / 2);
      const z = -level * config.depthSpread / 4;

      levelNodes.forEach((node, i) => {
        node.x = (i - levelNodes.length / 2) * config.spacing;
        node.y = y;
        node.z = z;
      });
    });
  }

  /**
   * Timeline Layout
   * Linear chronological arrangement on X-axis
   */
  private applyTimelineLayout(nodes: NM3Node[], config: LayoutConfig): void {
    nodes.forEach((node, i) => {
      node.x = (i - nodes.length / 2) * config.spacing;
      node.y = Math.sin((i / nodes.length) * Math.PI) * config.verticalSpread / 2;
      node.z = 0;
    });
  }

  /**
   * Concept Map Layout
   * Clustered by topic in circular arrangement
   */
  private applyConceptMapLayout(nodes: NM3Node[], config: LayoutConfig): void {
    const clusterCount = Math.min(5, Math.ceil(nodes.length / 4));
    const clusters: NM3Node[][] = [];

    for (let i = 0; i < clusterCount; i++) {
      clusters.push([]);
    }

    nodes.forEach((node, i) => {
      const clusterIndex = i % clusterCount;
      clusters[clusterIndex].push(node);
    });

    // Position clusters
    clusters.forEach((cluster, clusterIndex) => {
      const angle = (clusterIndex / clusterCount) * Math.PI * 2;
      const clusterRadius = config.horizontalSpread;
      const centerX = Math.cos(angle) * clusterRadius;
      const centerZ = Math.sin(angle) * clusterRadius;

      // Position nodes within cluster
      cluster.forEach((node, i) => {
        const localAngle = (i / cluster.length) * Math.PI * 2;
        const localRadius = config.spacing * 2;

        node.x = centerX + Math.cos(localAngle) * localRadius;
        node.z = centerZ + Math.sin(localAngle) * localRadius;
        node.y = 0;
      });
    });
  }

  /**
   * Categorize nodes by title keywords
   */
  private categorizeByTitle(nodes: NM3Node[]): {
    intro: NM3Node[];
    methods: NM3Node[];
    results: NM3Node[];
    conclusion: NM3Node[];
    references: NM3Node[];
    other: NM3Node[];
  } {
    return {
      intro: nodes.filter(n => {
        const title = n.title?.toLowerCase() || '';
        return title.includes('intro') ||
               title.includes('abstract') ||
               title.includes('overview');
      }),
      methods: nodes.filter(n => {
        const title = n.title?.toLowerCase() || '';
        return title.includes('method') ||
               title.includes('approach') ||
               title.includes('implementation');
      }),
      results: nodes.filter(n => {
        const title = n.title?.toLowerCase() || '';
        return title.includes('result') ||
               title.includes('finding') ||
               title.includes('outcome');
      }),
      conclusion: nodes.filter(n => {
        const title = n.title?.toLowerCase() || '';
        return title.includes('conclusion') ||
               title.includes('summary') ||
               title.includes('future');
      }),
      references: nodes.filter(n => {
        const title = n.title?.toLowerCase() || '';
        return title.includes('reference') ||
               title.includes('citation') ||
               title.includes('bibliography');
      }),
      other: nodes.filter(n => {
        const title = n.title?.toLowerCase() || '';
        return !(
          title.includes('intro') || title.includes('abstract') ||
          title.includes('method') || title.includes('approach') ||
          title.includes('result') || title.includes('finding') ||
          title.includes('conclusion') || title.includes('summary') ||
          title.includes('reference') || title.includes('citation')
        );
      }),
    };
  }
}
