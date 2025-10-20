// Integrated Spatial Optimizer V2
// Combines force-directed layout, collision detection, and layout templates

import { NM3Node, NM3Link } from '../models/types.js';
import { ForceDirected3D, ForceConfig } from './force-directed-3d.js';
import { CollisionDetector } from './collision-detector.js';
import { LayoutTemplates, LayoutType } from './layout-templates.js';

export interface OptimizationConfig {
  useForceDirected: boolean;
  useCollisionResolution: boolean;
  useLayoutTemplate?: LayoutType;
  forceConfig?: Partial<ForceConfig>;
  maxIterations?: number;
  minSeparation?: number;
}

/**
 * Spatial Optimizer V2 - Unified spatial optimization system
 * Integrates layout templates, force-directed layout, and collision resolution
 */
export class SpatialOptimizerV2 {
  private forceDirected: ForceDirected3D;
  private collisionDetector: CollisionDetector;
  private layoutTemplates: LayoutTemplates;

  constructor() {
    this.forceDirected = new ForceDirected3D();
    this.collisionDetector = new CollisionDetector();
    this.layoutTemplates = new LayoutTemplates();
  }

  /**
   * Optimize spatial layout using configured techniques
   */
  optimize(
    nodes: NM3Node[],
    links: NM3Link[],
    config: OptimizationConfig = {
      useForceDirected: true,
      useCollisionResolution: true,
    }
  ): void {
    console.error('🎯 Starting spatial optimization...');

    // Step 1: Apply layout template if specified, OR initialize with random positions
    if (config.useLayoutTemplate) {
      console.error(`   Applying ${config.useLayoutTemplate} template...`);
      this.layoutTemplates.applyTemplate(nodes, config.useLayoutTemplate);
    } else {
      // Initialize with random positions to give force-directed layout something to work with
      console.error('   Initializing random positions...');
      this.initializeRandomPositions(nodes);
    }

    // Step 2: Apply force-directed layout for organic positioning
    if (config.useForceDirected) {
      console.error('   Running force-directed simulation...');
      
      // Create custom force config if provided
      if (config.forceConfig) {
        this.forceDirected = new ForceDirected3D(config.forceConfig);
      }
      
      this.forceDirected.simulate(
        nodes,
        links,
        config.maxIterations || 100,
        (iter, energy) => {
          if (iter % 20 === 0) {
            console.error(`      Iteration ${iter}: energy = ${energy.toFixed(4)}`);
          }
        }
      );
    }

    // Step 3: Resolve any remaining collisions
    if (config.useCollisionResolution) {
      console.error('   Resolving collisions...');
      
      if (config.minSeparation) {
        this.collisionDetector = new CollisionDetector(config.minSeparation);
      }
      
      const resolved = this.collisionDetector.resolveCollisions(nodes, 20);
      console.error(`      Resolved ${resolved} collision(s)`);
    }

    // Step 4: Apply spatial conventions
    this.applySpatialConventions(nodes);

    console.error('✅ Spatial optimization complete!');
  }

  /**
   * Apply NM3 spatial conventions
   * Z-axis: Importance (forward/back)
   * Y-axis: Abstraction level (up/down)
   * X-axis: Categorization (left/right)
   */
  private applySpatialConventions(nodes: NM3Node[]): void {
    for (const node of nodes) {
      const scale = node.scale || 1.0;

      // Z-axis: Importance (scale-based)
      if (scale > 1.5) {
        // Important nodes come forward
        node.z += 5;
      } else if (scale < 0.8) {
        // Less important nodes go back
        node.z -= 3;
      }

      // Y-axis: Abstraction level (type-based)
      if (node.type === 'pyramid') {
        // Hierarchical/conclusion nodes go higher
        node.y += 2;
      } else if (node.type === 'torus') {
        // Cyclical nodes at medium height
        node.y += 1;
      } else if (node.type === 'cube') {
        // Technical/foundational nodes lower
        if (node.tags?.includes('code') || node.tags?.includes('technical')) {
          node.y -= 1;
        }
      }
    }
  }

  /**
   * Initialize nodes with random positions
   * This gives force-directed layout initial separation to work with
   */
  private initializeRandomPositions(nodes: NM3Node[]): void {
    const spreadRadius = Math.max(10, nodes.length * 2);
    
    nodes.forEach(node => {
      // Random spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = Math.random() * spreadRadius;
      
      node.x = r * Math.sin(phi) * Math.cos(theta);
      node.y = r * Math.sin(phi) * Math.sin(theta);
      node.z = r * Math.cos(phi);
    });
  }

  /**
   * Calculate bounding box and center of all nodes
   */
  calculateBounds(nodes: NM3Node[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
    centerX: number;
    centerY: number;
    centerZ: number;
  } {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const node of nodes) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
      minZ = Math.min(minZ, node.z);
      maxZ = Math.max(maxZ, node.z);
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
      minZ,
      maxZ,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      centerZ: (minZ + maxZ) / 2,
    };
  }

  /**
   * Normalize node positions to fit within target bounds
   */
  normalizePositions(
    nodes: NM3Node[],
    targetBounds?: { width: number; height: number; depth: number }
  ): void {
    const bounds = this.calculateBounds(nodes);

    const currentWidth = bounds.maxX - bounds.minX;
    const currentHeight = bounds.maxY - bounds.minY;
    const currentDepth = bounds.maxZ - bounds.minZ;

    if (targetBounds && currentWidth > 0 && currentHeight > 0 && currentDepth > 0) {
      const scaleX = targetBounds.width / currentWidth;
      const scaleY = targetBounds.height / currentHeight;
      const scaleZ = targetBounds.depth / currentDepth;

      for (const node of nodes) {
        node.x = (node.x - bounds.centerX) * scaleX;
        node.y = (node.y - bounds.centerY) * scaleY;
        node.z = (node.z - bounds.centerZ) * scaleZ;
      }
    }
  }
}
