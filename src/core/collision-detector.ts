// Collision Detection and Resolution System
// Uses Octree for efficient spatial queries to detect and resolve node overlaps

import { NM3Node } from '../models/types.js';
import { Octree, OctreeNode } from './octree.js';

export interface CollisionInfo {
  node1: string;
  node2: string;
  overlap: number;
  separationVector: { x: number; y: number; z: number };
}

/**
 * Collision detector that uses octree-based spatial indexing
 * for efficient collision detection and resolution
 */
export class CollisionDetector {
  private octree: Octree | null = null;
  private minSeparation: number;

  constructor(minSeparation: number = 2.0) {
    this.minSeparation = minSeparation;
  }

  /**
   * Detect all collisions between nodes
   * Returns array of collision information
   */
  detectCollisions(nodes: NM3Node[]): CollisionInfo[] {
    const collisions: CollisionInfo[] = [];

    // Build octree for efficient spatial queries
    this.buildOctree(nodes);

    for (const node1 of nodes) {
      const radius1 = this.getNodeRadius(node1);
      const searchRadius = radius1 + this.minSeparation + 5; // Max possible overlap distance

      // Find nearby nodes using octree
      const nearby = this.octree!.findNearby(node1.x, node1.y, node1.z, searchRadius);

      for (const octreeNode of nearby) {
        if (octreeNode.id === node1.id) continue;

        const node2 = octreeNode.data as NM3Node;
        const radius2 = this.getNodeRadius(node2);

        const collision = this.checkCollision(node1, node2, radius1, radius2);
        if (collision) {
          collisions.push(collision);
        }
      }
    }

    return collisions;
  }

  /**
   * Resolve collisions by iteratively pushing nodes apart
   * Returns total number of collisions resolved
   */
  resolveCollisions(nodes: NM3Node[], maxIterations: number = 20): number {
    let totalResolved = 0;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const collisions = this.detectCollisions(nodes);

      if (collisions.length === 0) {
        console.error(`   Converged at iteration ${iteration}`);
        break;
      }

      totalResolved += collisions.length;

      // Resolve collisions by pushing nodes apart
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      for (const collision of collisions) {
        const node1 = nodeMap.get(collision.node1);
        const node2 = nodeMap.get(collision.node2);

        if (!node1 || !node2) continue;

        // Push nodes apart equally (weighted by scale)
        const scale1 = node1.scale || 1.0;
        const scale2 = node2.scale || 1.0;
        const totalScale = scale1 + scale2;

        // Lighter nodes move more (inverse weight)
        const weight1 = scale2 / totalScale;
        const weight2 = scale1 / totalScale;

        // Apply separation with dampening (0.5 factor)
        node1.x -= collision.separationVector.x * weight1 * 0.5;
        node1.y -= collision.separationVector.y * weight1 * 0.5;
        node1.z -= collision.separationVector.z * weight1 * 0.5;

        node2.x += collision.separationVector.x * weight2 * 0.5;
        node2.y += collision.separationVector.y * weight2 * 0.5;
        node2.z += collision.separationVector.z * weight2 * 0.5;
      }

      // Rebuild octree for next iteration
      this.buildOctree(nodes);
    }

    return totalResolved;
  }

  /**
   * Build octree from all nodes
   */
  private buildOctree(nodes: NM3Node[]): void {
    // Calculate bounds from all nodes
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const node of nodes) {
      const radius = this.getNodeRadius(node);
      minX = Math.min(minX, node.x - radius);
      minY = Math.min(minY, node.y - radius);
      minZ = Math.min(minZ, node.z - radius);
      maxX = Math.max(maxX, node.x + radius);
      maxY = Math.max(maxY, node.y + radius);
      maxZ = Math.max(maxZ, node.z + radius);
    }

    // Add padding
    const padding = 10;
    const bounds = {
      minX: minX - padding,
      minY: minY - padding,
      minZ: minZ - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
      maxZ: maxZ + padding,
    };

    this.octree = new Octree(bounds);

    // Insert all nodes
    for (const node of nodes) {
      const radius = this.getNodeRadius(node);
      this.octree.insert({
        id: node.id,
        x: node.x,
        y: node.y,
        z: node.z,
        radius,
        data: node,
      });
    }
  }

  /**
   * Check if two nodes collide
   */
  private checkCollision(
    node1: NM3Node,
    node2: NM3Node,
    radius1: number,
    radius2: number
  ): CollisionInfo | null {
    const dx = node2.x - node1.x;
    const dy = node2.y - node1.y;
    const dz = node2.z - node1.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const minDistance = radius1 + radius2 + this.minSeparation;

    if (distance < minDistance) {
      const overlap = minDistance - distance;
      const norm = distance > 0 ? distance : 1;

      return {
        node1: node1.id,
        node2: node2.id,
        overlap,
        separationVector: {
          x: (dx / norm) * overlap,
          y: (dy / norm) * overlap,
          z: (dz / norm) * overlap,
        },
      };
    }

    return null;
  }

  /**
   * Calculate effective radius of a node based on scale
   */
  private getNodeRadius(node: NM3Node): number {
    const baseRadius = 1.0;
    const scale = node.scale || 1.0;
    return baseRadius * scale;
  }

  /**
   * Simple overlap check between two nodes
   */
  checkOverlap(node1: NM3Node, node2: NM3Node): boolean {
    const radius1 = this.getNodeRadius(node1);
    const radius2 = this.getNodeRadius(node2);

    const dx = node2.x - node1.x;
    const dy = node2.y - node1.y;
    const dz = node2.z - node1.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return distance < radius1 + radius2 + this.minSeparation;
  }
}
