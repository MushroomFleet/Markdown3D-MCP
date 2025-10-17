import { EnhancedTransformer } from './core/enhanced-transformer.js';
import { NM3XMLBuilder } from './core/xml-builder.js';
import { SimpleTransformer } from './core/transformer.js';
import { MarkdownParser } from './core/parser.js';
import fs from 'fs';

const testMarkdown = `
# AI Research Overview

This document explores cutting-edge AI developments. See [[machine-learning-fundamentals]] for fundamentals.

## Machine Learning Fundamentals

**Critical**: Understanding these concepts is essential for all AI work.

Machine learning enables systems to learn from experience. Related to [[deep-learning-revolution]].

### Supervised Learning

Step 1: Collect labeled training data
Step 2: Train the model
Step 3: Evaluate performance

This process follows a standard workflow for predictive modeling.

### Unsupervised Learning

Clustering and dimensionality reduction techniques for pattern discovery.

## Deep Learning Revolution

Deep learning has transformed AI capabilities. Based on [[machine-learning-fundamentals]] principles.

### Transformer Architecture

The attention mechanism revolutionized NLP. This is an excellent breakthrough!

\`\`\`python
def attention(Q, K, V):
    scores = Q @ K.T / sqrt(d_k)
    weights = softmax(scores)
    return weights @ V
\`\`\`

As mentioned in the Introduction, this changed everything.

## Training Cycle

The training process is a continuous feedback loop:
- Data preparation → Model training
- Evaluation → Refinement
- Back to data preparation

This iterative cycle ensures continuous improvement.

## Common Problems

### Problem: Overfitting
**Error**: Model fails to generalize. This is critical!

Solution: Implement regularization and dropout.

### Problem: Vanishing Gradients
Solution: Use ReLU activation and careful initialization.

## Future Directions

What are the next breakthroughs in AI?
- AGI development
- Quantum computing integration
- Neuromorphic hardware

How will these advances change society?

## References

Key papers and sources:
- Vaswani et al., "Attention is All You Need", 2017
- Goodfellow et al., "Deep Learning", MIT Press
`;

async function testEnhanced() {
  console.log('🧠 Testing Phase 2 Intelligence Engine\n');
  console.log('='.repeat(60));
  
  const transformer = new EnhancedTransformer();
  const xmlBuilder = new NM3XMLBuilder();
  
  console.log('\n📊 Performing intelligent transformation...');
  const startTime = Date.now();
  const nm3Doc = await transformer.transform(testMarkdown);
  const transformTime = Date.now() - startTime;
  
  console.log(`\n✨ Intelligence Results (${transformTime}ms):`);
  console.log(`   Nodes: ${nm3Doc.nodes.length}`);
  console.log(`   Links: ${nm3Doc.links.length}`);
  console.log(`   Tags: ${nm3Doc.meta.tags}`);
  console.log(`   Description: ${nm3Doc.meta.description}`);
  
  // Show node details
  console.log('\n📦 Node Intelligence:');
  nm3Doc.nodes.forEach(node => {
    console.log(`   [${node.id}]`);
    console.log(`      Shape: ${node.type.padEnd(10)} | Color: ${(node.color || 'pastel-blue').padEnd(15)} | Scale: ${node.scale?.toFixed(2)}`);
    console.log(`      Position: (${node.x.toFixed(1)}, ${node.y.toFixed(1)}, ${node.z.toFixed(1)})`);
    console.log(`      Tags: ${node.tags}`);
  });
  
  // Show link details
  console.log('\n🔗 Intelligent Links:');
  const linksByType = new Map<string, number>();
  nm3Doc.links.forEach(link => {
    const type = link.type || 'unknown';
    linksByType.set(type, (linksByType.get(type) || 0) + 1);
    const style = link.dashed ? 'dashed' : link.animated ? 'animated' : 'solid';
    console.log(`   ${link.from.padEnd(30)} --[${link.type}]--> ${link.to} (${style}, ${link.thickness?.toFixed(1)})`);
  });
  
  console.log('\n📊 Link Type Summary:');
  linksByType.forEach((count, type) => {
    console.log(`   ${type}: ${count}`);
  });
  
  // Compare with Phase 1
  console.log('\n' + '='.repeat(60));
  console.log('📈 Phase 1 vs Phase 2 Comparison\n');
  
  const parser = new MarkdownParser();
  const simpleTransformer = new SimpleTransformer();
  const sections = parser.parse(testMarkdown);
  const phase1Doc = simpleTransformer.transform(sections);
  
  console.log('Phase 1 (SimpleTransformer):');
  console.log(`   Nodes: ${phase1Doc.nodes.length}`);
  console.log(`   Links: ${phase1Doc.links.length} (hierarchy + sequential only)`);
  console.log(`   Shapes: Simple rules (code → cube, level → sphere)`);
  console.log(`   Colors: Basic patterns`);
  console.log(`   Layout: Grid-based`);
  
  console.log('\nPhase 2 (EnhancedTransformer):');
  console.log(`   Nodes: ${nm3Doc.nodes.length}`);
  console.log(`   Links: ${nm3Doc.links.length} (+${nm3Doc.links.length - phase1Doc.links.length} from intelligence)`);
  console.log(`   Shapes: Multi-factor scoring (content + sentiment + structure)`);
  console.log(`   Colors: Semantic + sentiment aware`);
  console.log(`   Layout: Category clustering + force-directed`);
  
  const improvement = ((nm3Doc.links.length - phase1Doc.links.length) / phase1Doc.links.length * 100).toFixed(0);
  console.log(`\n✨ Improvements:`);
  console.log(`   📈 ${improvement}% more links (hidden connections revealed)`);
  console.log(`   🎯 Context-aware shapes (process → cylinder, loop → torus)`);
  console.log(`   🎨 Emotional colors (success → green, error → pink)`);
  console.log(`   🗺️  Optimized layout (related content grouped)`);
  console.log(`   🧠 Graph-based importance (centrality-aware scaling)`);
  
  // Save output
  const xml = xmlBuilder.buildXML(nm3Doc);
  fs.writeFileSync('test-enhanced.nm3', xml);
  console.log(`\n💾 Output saved: test-enhanced.nm3 (${xml.length} bytes)`);
  
  // Validate
  const validation = xmlBuilder.validateXML(xml);
  console.log(`\n✅ Validation: ${validation.valid ? 'PASS' : 'FAIL'}`);
  if (!validation.valid) {
    console.log(`   Error: ${validation.error}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Phase 2 Intelligence Engine Test Complete!\n');
}

testEnhanced().catch(console.error);
