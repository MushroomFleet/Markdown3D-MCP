import { MarkdownParser } from './core/parser.js';
import { SimpleTransformer } from './core/transformer.js';
import { NM3XMLBuilder } from './core/xml-builder.js';
import fs from 'fs';

// Test markdown
const testMarkdown = `
# AI Research Overview

This document explores cutting-edge AI developments.

## Machine Learning Fundamentals

Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.

### Supervised Learning

- Classification problems
- Regression analysis
- Neural networks

### Unsupervised Learning

Clustering and dimensionality reduction techniques.

## Deep Learning Revolution

Deep learning has transformed AI capabilities across domains.

### Transformer Architecture

The attention mechanism has revolutionized NLP:

\`\`\`python
def attention(Q, K, V):
    scores = Q @ K.T / sqrt(d_k)
    weights = softmax(scores)
    return weights @ V
\`\`\`

## Future Directions

What are the next breakthroughs in AI?

- AGI development
- Ethical AI frameworks
- Quantum computing integration

## References

Key papers and sources for further reading.
`;

async function test() {
  console.log('🚀 Testing Markdown3D transformation...\n');
  
  // Parse
  const parser = new MarkdownParser();
  const sections = parser.parse(testMarkdown);
  console.log(`📄 Parsed ${sections.length} sections:`);
  sections.forEach(s => {
    console.log(`  ${' '.repeat(s.level * 2)}• [${s.id}] ${s.title} (${s.metadata.wordCount} words)`);
  });
  
  // Transform
  const transformer = new SimpleTransformer();
  const nm3Doc = transformer.transform(sections);
  console.log(`\n🎯 Generated ${nm3Doc.nodes.length} nodes and ${nm3Doc.links.length} links`);
  
  // Build XML
  const xmlBuilder = new NM3XMLBuilder();
  const xml = xmlBuilder.buildXML(nm3Doc);
  
  // Validate
  const validation = xmlBuilder.validateXML(xml);
  console.log(`\n✅ XML Valid: ${validation.valid}`);
  
  if (!validation.valid) {
    console.log(`❌ Validation Error: ${validation.error}`);
  }
  
  // Save output
  const outputFile = 'test-output.nm3';
  fs.writeFileSync(outputFile, xml);
  console.log(`\n💾 Saved to ${outputFile} (${xml.length} bytes)`);
  
  // Show sample
  console.log('\n📋 Sample output (first 500 chars):');
  console.log(xml.substring(0, 500) + '...');
  
  // Summary
  console.log('\n✨ Summary:');
  console.log(`   Sections parsed: ${sections.length}`);
  console.log(`   Nodes created: ${nm3Doc.nodes.length}`);
  console.log(`   Links created: ${nm3Doc.links.length}`);
  console.log(`   XML size: ${xml.length} bytes`);
  console.log(`   Valid: ${validation.valid ? '✓' : '✗'}`);
}

test().catch(console.error);
