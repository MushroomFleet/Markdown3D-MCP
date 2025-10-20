// 3D Force-Directed Graph Layout Engine
// Uses physics simulation (repulsion, attraction, centering) for organic node positioning

import { NM3Node, NM3Link } from '../models/types.js';

export interface ForceConfig {
  repulsionStrength: number;
  attractionStrength: number;
  centeringStrength: number;
  damping: number;
  minDistance: number;
  maxDistance: number;
}

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * 3D Force-Directed Layout Engine
 * Applies physics-based forces to create organic, balanced node arrangements
 */
export class ForceDirected3D {
  private config: ForceConfig;
  private velocities: Map<string, Vector3D>;

  constructor(config?: Partial<ForceConfig>) {
    this.config = {
      repulsionStrength: 50,
      attractionStrength: 0.1,
      centeringStrength: 0.01,
      damping: 0.8,
      minDistance: 3,
      maxDistance: 30,
      ...config,
    };
    this.velocities = new Map();
  }

  /**
   * Run force-directed simulation for N iterations
   */
  simulate(
    nodes: NM3Node[],
    links: NM3Link[],
    iterations: number = 100,
    progressCallback?: (iteration: number, energy: number) => void
  ): void {
    // Initialize velocities
    this.velocities.clear();
    nodes.forEach(node => {
      this.velocities.set(node.id, { x: 0, y: 0, z: 0 });
    });

    // Build adjacency map for faster lookup
    const adjacency = this.buildAdjacencyMap(links);

    // Run simulation
    for (let iter = 0; iter < iterations; iter++) {
      const forces = this.calculateForces(nodes, adjacency);
      const energy = this.applyForces(nodes, forces);

      if (progressCallback) {
        progressCallback(iter, energy);
      }

      // Early stopping if system has stabilized
      if (energy < 0.01) {
        console.error(`   Converged at iteration ${iter}`);
        break;
      }
    }
  }

  /**
   * Build adjacency map from links (undirected for force calculation)
   */
  private buildAdjacencyMap(links: NM3Link[]): Map<string, Set<string>> {
    const adjacency = new Map<string, Set<string>>();

    for (const link of links) {
      if (!adjacency.has(link.from)) {
        adjacency.set(link.from, new Set());
      }
      if (!adjacency.has(link.to)) {
        adjacency.set(link.to, new Set());
      }

      adjacency.get(link.from)!.add(link.to);
      adjacency.get(link.to)!.add(link.from); // Undirected
    }

    return adjacency;
  }

  /**
   * Calculate all forces acting on nodes
   */
  private calculateForces(
    nodes: NM3Node[],
    adjacency: Map<string, Set<string>>
  ): Map<string, Vector3D> {
    const forces = new Map<string, Vector3D>();

    // Initialize forces
    nodes.forEach(node => {
      forces.set(node.id, { x: 0, y: 0, z: 0 });
    });

    // Calculate center of mass
    let centerX = 0, centerY = 0, centerZ = 0;
    nodes.forEach(node => {
      centerX += node.x;
      centerY += node.y;
      centerZ += node.z;
    });
    centerX /= nodes.length;
    centerY /= nodes.length;
    centerZ /= nodes.length;

    // Apply forces for each node
    for (let i = 0; i < nodes.length; i++) {
      const node1 = nodes[i];
      const force = forces.get(node1.id)!;

      // 1. Repulsion forces between all nodes (Coulomb's law)
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;

        const node2 = nodes[j];
        const dx = node1.x - node2.x;
        const dy = node1.y - node2.y;
        const dz = node1.z - node2.z;
        const distSquared = dx * dx + dy * dy + dz * dz;
        const dist = Math.sqrt(distSquared);

        if (dist > 0 && dist < this.config.maxDistance) {
          // F = k / d^2
          const repulsion = this.config.repulsionStrength / (distSquared + 0.1);
          force.x += (dx / dist) * repulsion;
          force.y += (dy / dist) * repulsion;
          force.z += (dz / dist) * repulsion;
        }
      }

      // 2. Attraction forces for connected nodes (Hooke's law)
      const neighbors = adjacency.get(node1.id);
      if (neighbors) {
        for (const neighborId of neighbors) {
          const node2 = nodes.find(n => n.id === neighborId);
          if (!node2) continue;

          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const dz = node2.z - node1.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist > this.config.minDistance) {
            // F = k * (d - d_min)
            const attraction = this.config.attractionStrength * (dist - this.config.minDistance);
            force.x += (dx / dist) * attraction;
            force.y += (dy / dist) * attraction;
            force.z += (dz / dist) * attraction;
          }
        }
      }

      // 3. Centering force (gravity to center)
      const dx = centerX - node1.x;
      const dy = centerY - node1.y;
      const dz = centerZ - node1.z;
      force.x += dx * this.config.centeringStrength;
      force.y += dy * this.config.centeringStrength;
      force.z += dz * this.config.centeringStrength;
    }

    return forces;
  }

  /**
   * Apply forces to nodes and update positions
   * Returns total system energy for convergence check
   */
  private applyForces(
    nodes: NM3Node[],
    forces: Map<string, Vector3D>
  ): number {
    let totalEnergy = 0;

    for (const node of nodes) {
      const force = forces.get(node.id)!;
      const velocity = this.velocities.get(node.id)!;

      // Update velocity with damping
      velocity.x = (velocity.x + force.x) * this.config.damping;
      velocity.y = (velocity.y + force.y) * this.config.damping;
      velocity.z = (velocity.z + force.z) * this.config.damping;

      // Update position
      node.x += velocity.x;
      node.y += velocity.y;
      node.z += velocity.z;

      // Calculate energy (for convergence check)
      totalEnergy += Math.abs(velocity.x) + Math.abs(velocity.y) + Math.abs(velocity.z);
    }

    return totalEnergy / nodes.length;
  }

  /**
   * Reset velocities
   */
  reset(): void {
    this.velocities.clear();
  }
}
