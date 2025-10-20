// Octree Spatial Index for efficient 3D spatial queries
// Provides O(log n) performance for nearby node searches

export interface OctreeNode {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  data?: any;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

/**
 * Internal octree cell (not exported)
 * Represents a cubic region of 3D space that can be subdivided into 8 octants
 */
class OctreeCell {
  bounds: BoundingBox;
  nodes: OctreeNode[];
  children: OctreeCell[] | null;
  maxNodes: number;
  maxDepth: number;
  depth: number;

  constructor(
    bounds: BoundingBox,
    depth: number = 0,
    maxNodes: number = 8,
    maxDepth: number = 8
  ) {
    this.bounds = bounds;
    this.nodes = [];
    this.children = null;
    this.maxNodes = maxNodes;
    this.maxDepth = maxDepth;
    this.depth = depth;
  }

  /**
   * Insert a node into this cell or its children
   */
  insert(node: OctreeNode): boolean {
    // Check if node is within this cell's bounds
    if (!this.contains(node)) {
      return false;
    }

    // If we have space and haven't subdivided, add here
    if (this.nodes.length < this.maxNodes || this.depth >= this.maxDepth) {
      this.nodes.push(node);
      return true;
    }

    // Need to subdivide
    if (!this.children) {
      this.subdivide();
    }

    // Try to insert into children
    for (const child of this.children!) {
      if (child.insert(node)) {
        return true;
      }
    }

    // Fallback: add to this cell if children couldn't take it
    this.nodes.push(node);
    return true;
  }

  /**
   * Check if a node is within this cell's bounds
   */
  private contains(node: OctreeNode): boolean {
    return (
      node.x >= this.bounds.minX &&
      node.x <= this.bounds.maxX &&
      node.y >= this.bounds.minY &&
      node.y <= this.bounds.maxY &&
      node.z >= this.bounds.minZ &&
      node.z <= this.bounds.maxZ
    );
  }

  /**
   * Subdivide this cell into 8 octants
   */
  private subdivide(): void {
    const { minX, minY, minZ, maxX, maxY, maxZ } = this.bounds;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const midZ = (minZ + maxZ) / 2;

    const newDepth = this.depth + 1;

    this.children = [
      // Front-Bottom-Left (0)
      new OctreeCell(
        { minX, minY, minZ, maxX: midX, maxY: midY, maxZ: midZ },
        newDepth,
        this.maxNodes,
        this.maxDepth
      ),
      // Front-Bottom-Right (1)
      new OctreeCell(
        { minX: midX, minY, minZ, maxX, maxY: midY, maxZ: midZ },
        newDepth,
        this.maxNodes,
        this.maxDepth
      ),
      // Front-Top-Left (2)
      new OctreeCell(
        { minX, minY: midY, minZ, maxX: midX, maxY, maxZ: midZ },
        newDepth,
        this.maxNodes,
        this.maxDepth
      ),
      // Front-Top-Right (3)
      new OctreeCell(
        { minX: midX, minY: midY, minZ, maxX, maxY, maxZ: midZ },
        newDepth,
        this.maxNodes,
        this.maxDepth
      ),
      // Back-Bottom-Left (4)
      new OctreeCell(
        { minX, minY, minZ: midZ, maxX: midX, maxY: midY, maxZ },
        newDepth,
        this.maxNodes,
        this.maxDepth
      ),
      // Back-Bottom-Right (5)
      new OctreeCell(
        { minX: midX, minY, minZ: midZ, maxX, maxY: midY, maxZ },
        newDepth,
        this.maxNodes,
        this.maxDepth
      ),
      // Back-Top-Left (6)
      new OctreeCell(
        { minX, minY: midY, minZ: midZ, maxX: midX, maxY, maxZ },
        newDepth,
        this.maxNodes,
        this.maxDepth
      ),
      // Back-Top-Right (7)
      new OctreeCell(
        { minX: midX, minY: midY, minZ: midZ, maxX, maxY, maxZ },
        newDepth,
        this.maxNodes,
        this.maxDepth
      ),
    ];

    // Redistribute existing nodes to children
    const existingNodes = [...this.nodes];
    this.nodes = [];
    
    for (const node of existingNodes) {
      let inserted = false;
      for (const child of this.children) {
        if (child.insert(node)) {
          inserted = true;
          break;
        }
      }
      // Keep in this cell if couldn't insert into children
      if (!inserted) {
        this.nodes.push(node);
      }
    }
  }

  /**
   * Query for all nodes within a bounding box range
   */
  queryRange(range: BoundingBox): OctreeNode[] {
    const found: OctreeNode[] = [];

    // Check if range overlaps with this cell
    if (!this.intersects(range)) {
      return found;
    }

    // Check nodes in this cell
    for (const node of this.nodes) {
      if (this.nodeInRange(node, range)) {
        found.push(node);
      }
    }

    // Recursively check children
    if (this.children) {
      for (const child of this.children) {
        found.push(...child.queryRange(range));
      }
    }

    return found;
  }

  /**
   * Check if a bounding box intersects with this cell's bounds
   */
  private intersects(range: BoundingBox): boolean {
    return !(
      range.maxX < this.bounds.minX ||
      range.minX > this.bounds.maxX ||
      range.maxY < this.bounds.minY ||
      range.minY > this.bounds.maxY ||
      range.maxZ < this.bounds.minZ ||
      range.minZ > this.bounds.maxZ
    );
  }

  /**
   * Check if a node is within a bounding box range
   */
  private nodeInRange(node: OctreeNode, range: BoundingBox): boolean {
    return (
      node.x >= range.minX &&
      node.x <= range.maxX &&
      node.y >= range.minY &&
      node.y <= range.maxY &&
      node.z >= range.minZ &&
      node.z <= range.maxZ
    );
  }

  /**
   * Find all nodes within a sphere (radius from point)
   */
  findNearby(x: number, y: number, z: number, radius: number): OctreeNode[] {
    // Create bounding box for the sphere
    const range: BoundingBox = {
      minX: x - radius,
      minY: y - radius,
      minZ: z - radius,
      maxX: x + radius,
      maxY: y + radius,
      maxZ: z + radius,
    };

    // Get candidates from range query
    const candidates = this.queryRange(range);
    const radiusSquared = radius * radius;

    // Filter by actual distance (sphere, not box)
    return candidates.filter(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const dz = node.z - z;
      const distSquared = dx * dx + dy * dy + dz * dz;
      return distSquared <= radiusSquared;
    });
  }
}

/**
 * Octree spatial index for efficient 3D spatial queries
 * Public API for octree operations
 */
export class Octree {
  private root: OctreeCell;
  private bounds: BoundingBox;

  constructor(
    bounds: BoundingBox,
    maxNodes: number = 8,
    maxDepth: number = 8
  ) {
    this.bounds = bounds;
    this.root = new OctreeCell(bounds, 0, maxNodes, maxDepth);
  }

  /**
   * Insert a node into the octree
   */
  insert(node: OctreeNode): boolean {
    return this.root.insert(node);
  }

  /**
   * Query for all nodes within a bounding box range
   */
  queryRange(range: BoundingBox): OctreeNode[] {
    return this.root.queryRange(range);
  }

  /**
   * Find all nodes within a sphere (radius from point)
   */
  findNearby(x: number, y: number, z: number, radius: number): OctreeNode[] {
    return this.root.findNearby(x, y, z, radius);
  }

  /**
   * Clear the octree and reset to empty state
   */
  clear(): void {
    this.root = new OctreeCell(this.bounds);
  }
}
