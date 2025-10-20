import { OptimizedTransformer } from './core/optimized-transformer.js';
import { NM3XMLBuilder } from './core/xml-builder.js';
import { MemoryMonitor } from './core/memory-monitor.js';
import * as fs from 'fs';
import * as path from 'path';

async function testPhase4() {
  console.log('🚀 Phase 4 Performance Test - File Output\n');

  const transformer = new OptimizedTransformer();
  const xmlBuilder = new NM3XMLBuilder();
  const memoryMonitor = new MemoryMonitor();

  // Ensure output directory exists
  const outputDir = 'output/phase4';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Test 1: Small document
  console.log('═══════════════════════════════════════════');
  console.log('Test 1: Small Document');
  console.log('═══════════════════════════════════════════');
  const smallDoc = `# Introduction
This is a small test document.

## Section 1
Content for section 1.

## Section 2
Content for section 2.

### Subsection 2.1
More details here.
`;

  console.log(`Input size: ${smallDoc.length} bytes (${(smallDoc.length / 1024).toFixed(2)}KB)`);
  
  let start = Date.now();
  const result1 = await transformer.transformWithOptimizations(smallDoc, { 
    useCache: false,
    title: 'Small Test Document'
  });
  const duration1 = Date.now() - start;
  
  const xml1 = xmlBuilder.buildXML(result1);
  const outputPath1 = path.join(outputDir, 'small-test.nm3');
  fs.writeFileSync(outputPath1, xml1);
  
  console.log(`Output size: ${xml1.length} bytes (${(xml1.length / 1024).toFixed(2)}KB)`);
  console.log(`Nodes: ${result1.nodes.length}`);
  console.log(`Links: ${result1.links.length}`);
  console.log(`Time: ${duration1}ms`);
  console.log(`Output: ${outputPath1}`);
  console.log('✅ Small document test complete\n');

  // Test 2: Read actual test-book.md if it exists
  const testBookPath = 'docs/test-book.md';
  if (fs.existsSync(testBookPath)) {
    console.log('═══════════════════════════════════════════');
    console.log('Test 2: Real Document (test-book.md)');
    console.log('═══════════════════════════════════════════');
    
    const testBookContent = fs.readFileSync(testBookPath, 'utf-8');
    console.log(`Input size: ${testBookContent.length} bytes (${(testBookContent.length / 1024).toFixed(2)}KB)`);
    
    const mem1 = memoryMonitor.getStats();
    console.log(`Memory before: ${mem1.heapUsedMB.toFixed(2)}MB`);
    
    start = Date.now();
    const result2 = await transformer.transformWithOptimizations(testBookContent, {
      useCache: false,
      useStreaming: true,
      title: 'Test Book'
    });
    const duration2 = Date.now() - start;
    
    const xml2 = xmlBuilder.buildXML(result2);
    const outputPath2 = path.join(outputDir, 'test-book-phase4.nm3');
    fs.writeFileSync(outputPath2, xml2);
    
    const mem2 = memoryMonitor.getStats();
    console.log(`Output size: ${xml2.length} bytes (${(xml2.length / 1024).toFixed(2)}KB)`);
    console.log(`Nodes: ${result2.nodes.length}`);
    console.log(`Links: ${result2.links.length}`);
    console.log(`Time: ${duration2}ms`);
    console.log(`Memory after: ${mem2.heapUsedMB.toFixed(2)}MB (delta: ${(mem2.heapUsedMB - mem1.heapUsedMB).toFixed(2)}MB)`);
    console.log(`Output: ${outputPath2}`);
    console.log('✅ Real document test complete\n');
    
    // Test 3: Cache test - same document again
    console.log('═══════════════════════════════════════════');
    console.log('Test 3: Cache Test (same document)');
    console.log('═══════════════════════════════════════════');
    
    start = Date.now();
    const result3 = await transformer.transformWithOptimizations(testBookContent, {
      useCache: true,
      useStreaming: true,
      title: 'Test Book Cached'
    });
    const duration3 = Date.now() - start;
    
    const xml3 = xmlBuilder.buildXML(result3);
    const outputPath3 = path.join(outputDir, 'test-book-cached.nm3');
    fs.writeFileSync(outputPath3, xml3);
    
    console.log(`Time: ${duration3}ms (should be much faster!)`);
    console.log(`Speedup: ${(duration2 / duration3).toFixed(2)}x`);
    console.log(`Output: ${outputPath3}`);
    console.log('✅ Cache test complete\n');
  } else {
    console.log(`⚠️  Skipping test-book.md (file not found at ${testBookPath})\n`);
  }

  // Test 4: Large synthetic document
  console.log('═══════════════════════════════════════════');
  console.log('Test 4: Large Synthetic Document (1000 sections)');
  console.log('═══════════════════════════════════════════');
  
  const largeSections = Array.from({ length: 1000 }, (_, i) => 
    `# Section ${i}\n\nContent for section ${i} with some additional text to make it more realistic.\n\n## Subsection ${i}.1\n\nMore details about section ${i}.\n\n`
  );
  const largeDoc = largeSections.join('');
  
  console.log(`Input size: ${largeDoc.length} bytes (${(largeDoc.length / 1024).toFixed(2)}KB)`);
  console.log(`Streaming should activate: ${largeDoc.length > 50000 ? 'YES' : 'NO'}`);
  
  const mem3 = memoryMonitor.getStats();
  console.log(`Memory before: ${mem3.heapUsedMB.toFixed(2)}MB`);
  
  start = Date.now();
  const result4 = await transformer.transformWithOptimizations(largeDoc, {
    useCache: false,
    useStreaming: true,
    title: 'Large Synthetic Document'
  });
  const duration4 = Date.now() - start;
  
  const xml4 = xmlBuilder.buildXML(result4);
  const outputPath4 = path.join(outputDir, 'large-synthetic.nm3');
  fs.writeFileSync(outputPath4, xml4);
  
  const mem4 = memoryMonitor.getStats();
  console.log(`Output size: ${xml4.length} bytes (${(xml4.length / 1024).toFixed(2)}KB)`);
  console.log(`Nodes: ${result4.nodes.length}`);
  console.log(`Links: ${result4.links.length}`);
  console.log(`Time: ${duration4}ms`);
  console.log(`Memory after: ${mem4.heapUsedMB.toFixed(2)}MB (delta: ${(mem4.heapUsedMB - mem3.heapUsedMB).toFixed(2)}MB)`);
  console.log(`Output: ${outputPath4}`);
  console.log('✅ Large document test complete\n');

  // Final statistics
  console.log('═══════════════════════════════════════════');
  console.log('Final Statistics');
  console.log('═══════════════════════════════════════════');
  
  const cacheStats = transformer.getCacheStats();
  console.log('\n📊 Cache Performance:');
  for (const [cache, stats] of Object.entries(cacheStats)) {
    console.log(`  ${cache}:`);
    console.log(`    Hits: ${stats.hits}`);
    console.log(`    Misses: ${stats.misses}`);
    console.log(`    Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
  }
  
  const memFinal = memoryMonitor.getStats();
  console.log('\n💾 Memory:');
  console.log(`  Heap Used: ${memFinal.heapUsedMB.toFixed(2)}MB`);
  console.log(`  Heap Total: ${memFinal.heapTotalMB.toFixed(2)}MB`);
  console.log(`  Usage: ${memFinal.percentUsed.toFixed(1)}%`);
  
  console.log('\n📁 Output Files:');
  const files = fs.readdirSync(outputDir);
  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const stats = fs.statSync(filePath);
    console.log(`  ${file}: ${(stats.size / 1024).toFixed(2)}KB`);
  }
  
  console.log('\n✅ All tests complete! Inspect files in output/phase4/');
}

testPhase4().catch(console.error);
