import fs from 'fs/promises';
import { OptimizedTransformer } from './core/optimized-transformer.js';
import { NM3XMLBuilder } from './core/xml-builder.js';
import { ChunkManager } from './core/chunk-manager.js';

async function testChunkedSystem() {
  console.log('🧪 Testing Chunked Output System\n');
  
  const transformer = new OptimizedTransformer();
  const xmlBuilder = new NM3XMLBuilder();
  const chunkManager = new ChunkManager(30000);
  
  // Generate large markdown document
  console.log('📝 Generating large test document...');
  const sections = [];
  for (let i = 0; i < 500; i++) {
    sections.push(`# Section ${i}\n\nThis is content for section ${i}. `.repeat(10));
  }
  const largeMarkdown = sections.join('\n\n');
  console.log(`   Generated ${largeMarkdown.length} characters\n`);
  
  // Test 1: Transform to NM3
  console.log('Test 1: Transform large markdown to NM3');
  const start1 = Date.now();
  const document = await transformer.transformWithOptimizations(largeMarkdown, {
    useCache: false,
    useStreaming: true
  });
  const time1 = Date.now() - start1;
  console.log(`   ✓ Transform completed in ${time1}ms`);
  console.log(`   Generated ${document.nodes.length} nodes\n`);
  
  // Test 2: Build XML
  console.log('Test 2: Build XML from NM3 document');
  const start2 = Date.now();
  const xml = xmlBuilder.buildXML(document);
  const time2 = Date.now() - start2;
  console.log(`   ✓ XML built in ${time2}ms`);
  console.log(`   XML size: ${xml.length} characters\n`);
  
  // Test 3: Chunk XML
  console.log('Test 3: Chunk XML into 30KB segments');
  const start3 = Date.now();
  const chunkResult = await chunkManager.chunkXML(xml, 'test-large.nm3');
  const time3 = Date.now() - start3;
  console.log(`   ✓ Chunked in ${time3}ms`);
  console.log(`   Created ${chunkResult.chunkCount} chunks`);
  console.log(`   Manifest: ${chunkResult.manifestPath}\n`);
  
  // Test 4: Verify chunk status
  console.log('Test 4: Verify chunk status');
  const status = await chunkManager.getChunkStatus(chunkResult.manifestPath);
  console.log(`   Total chunks: ${status.totalChunks}`);
  console.log(`   Chunks present: ${status.chunksPresent}`);
  console.log(`   Missing chunks: ${status.missingChunks.length}`);
  if (status.chunksPresent === status.totalChunks) {
    console.log('   ✓ All chunks present\n');
  } else {
    console.log('   ✗ Missing chunks:', status.missingChunks);
    return;
  }
  
  // Test 5: Assemble chunks
  console.log('Test 5: Assemble chunks into final file');
  const start5 = Date.now();
  const outputPath = await chunkManager.assembleChunks(chunkResult.manifestPath);
  const time5 = Date.now() - start5;
  console.log(`   ✓ Assembled in ${time5}ms`);
  console.log(`   Output: ${outputPath}\n`);
  
  // Test 6: Verify output matches original
  console.log('Test 6: Verify assembled output matches original XML');
  const assembledXML = await fs.readFile(outputPath, 'utf-8');
  if (assembledXML === xml) {
    console.log('   ✓ Output matches original exactly\n');
  } else {
    console.log('   ✗ Output differs from original');
    console.log(`     Original: ${xml.length} chars`);
    console.log(`     Assembled: ${assembledXML.length} chars`);
    return;
  }
  
  // Test 7: Validate assembled XML
  console.log('Test 7: Validate assembled NM3 XML');
  const validation = xmlBuilder.validateXML(assembledXML);
  if (validation.valid) {
    console.log('   ✓ XML is valid\n');
  } else {
    console.log('   ✗ XML validation failed:', validation.error);
    return;
  }
  
  // Summary
  console.log('📊 Performance Summary:');
  console.log(`   Transform: ${time1}ms`);
  console.log(`   Build XML: ${time2}ms`);
  console.log(`   Chunk: ${time3}ms`);
  console.log(`   Assemble: ${time5}ms`);
  console.log(`   Total: ${time1 + time2 + time3 + time5}ms`);
  console.log('\n✅ All tests passed!');
  console.log(`\n💾 Output file preserved at: ${outputPath}`);
  console.log('   (File kept for inspection - delete manually when done)');
  
  // Cleanup test file - DISABLED to preserve output
  // Uncomment to enable automatic cleanup:
  // try {
  //   await fs.unlink(outputPath);
  //   console.log(`🗑️  Cleaned up test file: ${outputPath}`);
  // } catch (e) {
  //   console.log(`⚠️  Could not cleanup test file`);
  // }
}

testChunkedSystem().catch(console.error);
