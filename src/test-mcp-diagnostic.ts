#!/usr/bin/env node
/**
 * MCP Diagnostic Test
 * Tests the transformation pipeline with detailed output
 */

import { EnhancedTransformer } from './core/enhanced-transformer.js';
import { NM3XMLBuilder } from './core/xml-builder.js';
import * as fs from 'fs';
import * as path from 'path';

const TEST_MARKDOWN = `# Test Document

## Introduction
This is a test section with some content to analyze. It contains important information about testing.

## Key Concepts

### Concept A
This concept describes a fundamental principle. It's critical for understanding the system.

### Concept B  
This concept builds on Concept A and provides additional context. It's related to advanced topics.

## Implementation Details
Technical details about implementation. Contains code examples and specifics.

\`\`\`typescript
function example() {
  return "test";
}
\`\`\`

## Questions and Concerns
- What happens when we scale?
- How does this integrate with existing systems?
- Are there performance implications?

## Conclusion
Summary of the document with final thoughts and recommendations.
`;

async function runDiagnostic() {
  console.log('='.repeat(80));
  console.log('MCP DIAGNOSTIC TEST');
  console.log('='.repeat(80));
  console.log();

  const transformer = new EnhancedTransformer();
  const xmlBuilder = new NM3XMLBuilder();

  console.log('1. Testing Parser');
  console.log('-'.repeat(80));
  const sections = (transformer as any).parser.parse(TEST_MARKDOWN);
  console.log(`Parsed ${sections.length} sections:`);
  sections.forEach((s: any, i: number) => {
    console.log(`  [${i}] "${s.title}" (Level ${s.level})`);
    console.log(`      ID: ${s.id}`);
    console.log(`      Content length: ${s.content.length} chars`);
    console.log(`      Metadata:`, s.metadata);
    console.log(`      Children: ${s.children.length}`);
  });
  console.log();

  console.log('2. Testing Content Classification');
  console.log('-'.repeat(80));
  for (const section of sections) {
    const classification = (transformer as any).contentClassifier.classifySection(section, sections);
    console.log(`"${section.title}"`);
    console.log(`  Category: ${classification.category}`);
    console.log(`  Content Type:`, classification.contentType);
    console.log(`  Sentiment: ${classification.sentiment.score.toFixed(2)} (${classification.sentiment.label})`);
    console.log(`  Top Keywords:`, classification.keywords.slice(0, 3).map((k: any) => k.term).join(', '));
  }
  console.log();

  console.log('3. Testing Shape Assignment');
  console.log('-'.repeat(80));
  for (const section of sections) {
    const classification = (transformer as any).contentClassifier.classifySection(section, sections);
    const shape = (transformer as any).shapeAssigner.assignShape(section, classification);
    console.log(`"${section.title}": ${shape}`);
  }
  console.log();

  console.log('4. Testing Color Assignment');
  console.log('-'.repeat(80));
  for (const section of sections) {
    const classification = (transformer as any).contentClassifier.classifySection(section, sections);
    const color = (transformer as any).colorMapper.assignColor(section, classification);
    console.log(`"${section.title}": ${color}`);
  }
  console.log();

  console.log('5. Testing Full Transformation');
  console.log('-'.repeat(80));
  const nm3Doc = await transformer.transform(TEST_MARKDOWN);
  console.log(`Generated ${nm3Doc.nodes.length} nodes`);
  console.log(`Generated ${nm3Doc.links.length} links`);
  console.log();

  console.log('6. Analyzing Node Properties');
  console.log('-'.repeat(80));
  nm3Doc.nodes.forEach((node, i) => {
    console.log(`[${i}] "${node.title}"`);
    console.log(`    Type: ${node.type}, Scale: ${node.scale}`);
    console.log(`    Color: ${node.color}`);
    console.log(`    Position: (${node.x.toFixed(1)}, ${node.y.toFixed(1)}, ${node.z.toFixed(1)})`);
    console.log(`    Content length: ${node.content.length} chars`);
    console.log(`    Tags: ${node.tags || 'none'}`);
  });
  console.log();

  console.log('7. Analyzing Spatial Distribution');
  console.log('-'.repeat(80));
  const xValues = nm3Doc.nodes.map(n => n.x);
  const yValues = nm3Doc.nodes.map(n => n.y);
  const zValues = nm3Doc.nodes.map(n => n.z);
  
  console.log(`X-axis: min=${Math.min(...xValues).toFixed(1)}, max=${Math.max(...xValues).toFixed(1)}, range=${(Math.max(...xValues) - Math.min(...xValues)).toFixed(1)}`);
  console.log(`Y-axis: min=${Math.min(...yValues).toFixed(1)}, max=${Math.max(...yValues).toFixed(1)}, range=${(Math.max(...yValues) - Math.min(...yValues)).toFixed(1)}`);
  console.log(`Z-axis: min=${Math.min(...zValues).toFixed(1)}, max=${Math.max(...zValues).toFixed(1)}, range=${(Math.max(...zValues) - Math.min(...zValues)).toFixed(1)}`);
  console.log();

  console.log('8. Analyzing Links');
  console.log('-'.repeat(80));
  const linkTypes = new Map<string, number>();
  nm3Doc.links.forEach(link => {
    const type = link.type || 'unknown';
    linkTypes.set(type, (linkTypes.get(type) || 0) + 1);
  });
  console.log('Link type distribution:');
  linkTypes.forEach((count, type) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log();

  console.log('9. Generating XML');
  console.log('-'.repeat(80));
  const xml = xmlBuilder.buildXML(nm3Doc);
  const validation = xmlBuilder.validateXML(xml);
  console.log(`XML valid: ${validation.valid}`);
  if (!validation.valid) {
    console.log(`Validation error: ${validation.error}`);
  }
  console.log(`XML size: ${xml.length} bytes`);
  console.log();

  // Save output
  const outputDir = 'output/diagnostic';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'test-diagnostic.nm3');
  fs.writeFileSync(outputPath, xml, 'utf-8');
  console.log(`Saved to: ${outputPath}`);
  console.log();

  console.log('='.repeat(80));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(80));
}

runDiagnostic().catch(error => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});
