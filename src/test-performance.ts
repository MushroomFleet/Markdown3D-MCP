import { OptimizedTransformer } from './core/optimized-transformer.js';
import { MemoryMonitor } from './core/memory-monitor.js';

async function testPerformance() {
  console.log('🚀 Performance Test Suite\n');

  const transformer = new OptimizedTransformer();
  const memoryMonitor = new MemoryMonitor();

  // Test 1: Small document (no cache)
  console.log('Test 1: Small Document (100 lines)');
  const smallDoc = Array.from({ length: 10 }, (_, i) => 
    `# Section ${i}\n\nContent for section ${i}.\n\n`
  ).join('');

  let start = Date.now();
  await transformer.transformWithOptimizations(smallDoc, { useCache: false });
  console.log(`  Time: ${Date.now() - start}ms`);

  // Test 2: Same document (should hit cache)
  console.log('\nTest 2: Same Document (should hit cache)');
  start = Date.now();
  await transformer.transformWithOptimizations(smallDoc, { useCache: true });
  console.log(`  Time: ${Date.now() - start}ms`);

  // Test 3: Large document with streaming
  console.log('\nTest 3: Large Document (1000 sections)');
  const largeDoc = Array.from({ length: 1000 }, (_, i) => 
    `# Section ${i}\n\nContent for section ${i} with more details.\n\n`
  ).join('');

  console.log(`  Document size: ${(largeDoc.length / 1024).toFixed(2)}KB`);
  memoryMonitor.checkMemory();
  start = Date.now();
  await transformer.transformWithOptimizations(largeDoc, { 
    useCache: false,
    useStreaming: true 
  });
  console.log(`  Time: ${Date.now() - start}ms`);
  memoryMonitor.checkMemory();

  // Test 4: Large document again (cache hit)
  console.log('\nTest 4: Large Document (cache hit)');
  start = Date.now();
  await transformer.transformWithOptimizations(largeDoc, { 
    useCache: true,
    useStreaming: true 
  });
  console.log(`  Time: ${Date.now() - start}ms`);

  // Show stats
  console.log('\n📊 Final Statistics:');
  const stats = transformer.getCacheStats();
  for (const [cache, stat] of Object.entries(stats)) {
    console.log(`  ${cache}: ${stat.hits} hits, ${stat.misses} misses, ` +
                `${(stat.hitRate * 100).toFixed(1)}% hit rate`);
  }

  const mem = memoryMonitor.getStats();
  console.log(`\n💾 Memory: ${mem.heapUsedMB.toFixed(2)}MB / ${mem.heapTotalMB.toFixed(2)}MB`);
  console.log(`   Usage: ${mem.percentUsed.toFixed(1)}%`);
  
  console.log('\n✅ Performance tests complete!');
}

testPerformance().catch(console.error);
