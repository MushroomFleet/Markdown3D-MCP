import { Counter, Histogram, Gauge, register } from 'prom-client';

export class MetricsCollector {
  private static instance: MetricsCollector;
  
  private transformDuration: Histogram;
  private transformCount: Counter;
  private cacheHits: Counter;
  private cacheMisses: Counter;
  private nodeCount: Histogram;
  private memoryUsage: Gauge;

  private constructor() {
    // Transform duration histogram
    this.transformDuration = new Histogram({
      name: 'markdown3d_transform_duration_seconds',
      help: 'Duration of markdown to NM3 transformation',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    // Transform counter
    this.transformCount = new Counter({
      name: 'markdown3d_transform_total',
      help: 'Total number of transformations',
      labelNames: ['status'],
    });

    // Cache metrics
    this.cacheHits = new Counter({
      name: 'markdown3d_cache_hits_total',
      help: 'Total cache hits',
      labelNames: ['cache_type'],
    });

    this.cacheMisses = new Counter({
      name: 'markdown3d_cache_misses_total',
      help: 'Total cache misses',
      labelNames: ['cache_type'],
    });

    // Node count histogram
    this.nodeCount = new Histogram({
      name: 'markdown3d_node_count',
      help: 'Number of nodes in generated NM3',
      buckets: [10, 50, 100, 500, 1000, 5000],
    });

    // Memory usage gauge
    this.memoryUsage = new Gauge({
      name: 'markdown3d_memory_usage_bytes',
      help: 'Memory usage in bytes',
    });

    // Update memory usage periodically
    setInterval(() => {
      const usage = process.memoryUsage();
      this.memoryUsage.set(usage.heapUsed);
    }, 10000);
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  recordTransform(duration: number, nodeCount: number, success: boolean): void {
    this.transformDuration.observe(duration);
    this.transformCount.inc({ status: success ? 'success' : 'error' });
    this.nodeCount.observe(nodeCount);
  }

  recordCacheHit(cacheType: string): void {
    this.cacheHits.inc({ cache_type: cacheType });
  }

  recordCacheMiss(cacheType: string): void {
    this.cacheMisses.inc({ cache_type: cacheType });
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  clearMetrics(): void {
    register.clear();
  }
}
