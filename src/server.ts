#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { OptimizedTransformer } from './core/optimized-transformer.js';
import { NM3XMLBuilder } from './core/xml-builder.js';
import { MemoryMonitor } from './core/memory-monitor.js';
import { MetricsCollector } from './core/metrics.js';
import { ChunkManager } from './core/chunk-manager.js';

export class Markdown3DServer {
  private server: Server;
  private transformer: OptimizedTransformer;
  private xmlBuilder: NM3XMLBuilder;
  private memoryMonitor: MemoryMonitor;
  private metrics: MetricsCollector;
  private chunkManager: ChunkManager;

  constructor() {
    this.server = new Server(
      {
        name: 'markdown3d-mcp',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.transformer = new OptimizedTransformer();
    this.xmlBuilder = new NM3XMLBuilder();
    this.memoryMonitor = new MemoryMonitor();
    this.metrics = MetricsCollector.getInstance();
    this.chunkManager = new ChunkManager(30000); // 30KB chunks
    
    // Start memory monitoring
    this.memoryMonitor.startMonitoring(30000);
    
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'transform_to_nm3',
          description: 'Transform markdown to NM3 (returns full XML - may truncate for large docs >300 nodes)',
          inputSchema: {
            type: 'object',
            properties: {
              markdown: {
                type: 'string',
                description: 'Markdown content to transform'
              },
              title: {
                type: 'string',
                description: 'Optional document title'
              },
              author: {
                type: 'string',
                description: 'Optional author name'
              },
              useCache: {
                type: 'boolean',
                description: 'Enable caching (default: true)',
                default: true
              },
              useStreaming: {
                type: 'boolean',
                description: 'Enable streaming for large documents (default: true)',
                default: true
              }
            },
            required: ['markdown']
          }
        },
        {
          name: 'transform_to_nm3_chunked',
          description: 'Transform markdown to NM3 with chunked output (prevents truncation for large docs)',
          inputSchema: {
            type: 'object',
            properties: {
              markdown: {
                type: 'string',
                description: 'Markdown content to transform'
              },
              outputName: {
                type: 'string',
                description: 'Output filename (default: output.nm3)',
                default: 'output.nm3'
              },
              workingDirectory: {
                type: 'string',
                description: 'Working directory for output file (captures where the final NM3 should be saved)'
              },
              title: {
                type: 'string',
                description: 'Optional document title'
              },
              author: {
                type: 'string',
                description: 'Optional author name'
              },
              useCache: {
                type: 'boolean',
                description: 'Enable caching (default: true)',
                default: true
              },
              useStreaming: {
                type: 'boolean',
                description: 'Enable streaming for large documents (default: true)',
                default: true
              }
            },
            required: ['markdown']
          }
        },
        {
          name: 'assemble_chunks',
          description: 'Assemble chunked output into final NM3 file',
          inputSchema: {
            type: 'object',
            properties: {
              manifestPath: {
                type: 'string',
                description: 'Path to manifest.json from chunked transform'
              },
              outputDirectory: {
                type: 'string',
                description: 'Optional output directory for the final NM3 file (defaults to current working directory)'
              }
            },
            required: ['manifestPath']
          }
        },
        {
          name: 'get_chunk_status',
          description: 'Check status of chunked output',
          inputSchema: {
            type: 'object',
            properties: {
              manifestPath: {
                type: 'string',
                description: 'Path to manifest.json'
              }
            },
            required: ['manifestPath']
          }
        },
        {
          name: 'validate_nm3',
          description: 'Validate NM3 XML for compliance with spec',
          inputSchema: {
            type: 'object',
            properties: {
              xml: {
                type: 'string',
                description: 'NM3 XML to validate'
              }
            },
            required: ['xml']
          }
        },
        {
          name: 'get_performance_stats',
          description: 'Get performance and cache statistics',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'clear_cache',
          description: 'Clear all caches',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'transform_to_nm3': {
            const { markdown, title, author, useCache = true, useStreaming = true } = args as any;
            
            // Warn about large documents
            if (markdown.length > 100000) {
              console.error('⚠️  WARNING: Large document detected. Consider using transform_to_nm3_chunked instead.');
            }
            
            // Check memory before processing
            const memStatus = this.memoryMonitor.checkMemory();
            if (memStatus === 'critical') {
              this.memoryMonitor.forceGC();
            }
            
            // Use optimized transformer with caching and streaming
            console.error('Starting optimized transformation...');
            const nm3Doc = await this.transformer.transformWithOptimizations(markdown, {
              title,
              author,
              useCache,
              useStreaming
            });
            
            // Build XML
            console.error(`✨ Generated ${nm3Doc.nodes.length} nodes with semantic analysis`);
            console.error(`🔗 Created ${nm3Doc.links.length} intelligent links`);
            const xml = this.xmlBuilder.buildXML(nm3Doc);
            
            // Validate
            const validation = this.xmlBuilder.validateXML(xml);
            if (!validation.valid) {
              console.error('XML validation failed:', validation.error);
              return {
                content: [
                  {
                    type: 'text',
                    text: `Error: Generated invalid XML - ${validation.error}`
                  }
                ]
              };
            }
            
            console.error('Transform complete!');
            return {
              content: [
                {
                  type: 'text',
                  text: xml
                }
              ]
            };
          }
          
          case 'transform_to_nm3_chunked': {
            const { 
              markdown, 
              outputName = 'output.nm3',
              workingDirectory,
              title, 
              author, 
              useCache = true, 
              useStreaming = true 
            } = args as any;
            
            console.error('🔨 Starting chunked transformation...');
            if (workingDirectory) {
              console.error(`   📁 Capturing working directory: ${workingDirectory}`);
            }
            
            // Memory check
            const memStatus = this.memoryMonitor.checkMemory();
            if (memStatus === 'critical') {
              this.memoryMonitor.forceGC();
            }
            
            // Transform to NM3 document
            console.error('   Phase 1: Transforming markdown to NM3...');
            const nm3Doc = await this.transformer.transformWithOptimizations(markdown, {
              title,
              author,
              useCache,
              useStreaming
            });
            
            console.error(`   ✨ Generated ${nm3Doc.nodes.length} nodes`);
            console.error(`   🔗 Created ${nm3Doc.links.length} links`);
            
            // Build XML
            console.error('   Phase 2: Building XML...');
            const xml = this.xmlBuilder.buildXML(nm3Doc);
            
            // Validate
            const validation = this.xmlBuilder.validateXML(xml);
            if (!validation.valid) {
              return {
                content: [{
                  type: 'text',
                  text: `Error: Generated invalid XML - ${validation.error}`
                }]
              };
            }
            
            // Chunk the XML
            console.error('   Phase 3: Chunking XML output...');
            const chunkResult = await this.chunkManager.chunkXML(xml, outputName, workingDirectory);
            
            // Return manifest info (NOT the XML itself)
            const response = `✅ Chunked transformation complete!

**Document Statistics:**
- Nodes: ${nm3Doc.nodes.length}
- Links: ${nm3Doc.links.length}
- Total size: ${xml.length} characters

**Chunking Results:**
- Total chunks: ${chunkResult.chunkCount}
- Chunk size: 30,000 characters each
- Manifest path: ${chunkResult.manifestPath}
- Temp directory: ${chunkResult.tempDir}

**Next Step:**
Call \`assemble_chunks\` with the manifest path to create the final ${outputName} file.

**Manifest Path:**
\`\`\`
${chunkResult.manifestPath}
\`\`\``;

            return {
              content: [{
                type: 'text',
                text: response
              }]
            };
          }
          
          case 'assemble_chunks': {
            const { manifestPath, outputDirectory } = args as any;
            
            console.error('🔨 Assembling chunks...');
            if (outputDirectory) {
              console.error(`   Output directory: ${outputDirectory}`);
            }
            
            try {
              const outputPath = await this.chunkManager.assembleChunks(manifestPath, outputDirectory);
              
              return {
                content: [{
                  type: 'text',
                  text: `✅ Assembly complete!\n\nFinal file written to: ${outputPath}\n\nAll chunks verified and concatenated successfully.`
                }]
              };
            } catch (error: any) {
              return {
                content: [{
                  type: 'text',
                  text: `❌ Assembly failed: ${error.message}\n\nPlease check that all chunks are present and the manifest is valid.`
                }]
              };
            }
          }
          
          case 'get_chunk_status': {
            const { manifestPath } = args as any;
            
            const status = await this.chunkManager.getChunkStatus(manifestPath);
            
            if (!status.exists) {
              return {
                content: [{
                  type: 'text',
                  text: `❌ Manifest not found: ${manifestPath}`
                }]
              };
            }
            
            const statusText = `📊 Chunk Status

**Manifest:** ${manifestPath}
**Total chunks:** ${status.totalChunks}
**Chunks present:** ${status.chunksPresent}
**Missing chunks:** ${status.missingChunks.length}

${status.missingChunks.length > 0 ? 
  `⚠️  Missing chunks:\n${status.missingChunks.map(c => `  - ${c}`).join('\n')}` : 
  '✅ All chunks present and ready for assembly'}`;
            
            return {
              content: [{
                type: 'text',
                text: statusText
              }]
            };
          }
          
          case 'validate_nm3': {
            const { xml } = args as any;
            const validation = this.xmlBuilder.validateXML(xml);
            
            return {
              content: [
                {
                  type: 'text',
                  text: validation.valid 
                    ? 'Valid NM3 XML!'
                    : `Invalid NM3 XML: ${validation.error}`
                }
              ]
            };
          }
          
          case 'get_performance_stats': {
            const cacheStats = this.transformer.getCacheStats();
            const memoryStats = this.memoryMonitor.getStats();
            const metrics = await this.metrics.getMetrics();

            const report = `# Performance Statistics

## Cache Stats
${Object.entries(cacheStats)
  .map(
    ([cache, stats]) =>
      `### ${cache}
- Hits: ${stats.hits}
- Misses: ${stats.misses}
- Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%
- Keys: ${stats.keys}`
  )
  .join('\n\n')}

## Memory Stats
- Heap Used: ${memoryStats.heapUsedMB.toFixed(2)}MB
- Heap Total: ${memoryStats.heapTotalMB.toFixed(2)}MB
- Percent Used: ${memoryStats.percentUsed.toFixed(2)}%
- RSS: ${(memoryStats.rss / 1024 / 1024).toFixed(2)}MB

## Prometheus Metrics
\`\`\`
${metrics}
\`\`\``;

            return {
              content: [
                {
                  type: 'text',
                  text: report
                }
              ]
            };
          }
          
          case 'clear_cache': {
            this.transformer.clearCache();
            return {
              content: [
                {
                  type: 'text',
                  text: 'Cache cleared successfully'
                }
              ]
            };
          }
          
          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `Unknown tool: ${name}`
                }
              ]
            };
        }
      } catch (error: any) {
        console.error('Error in tool handler:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Markdown3D MCP v4.0 - Chunked Output System Ready');
    console.error('✨ Features: Caching, Streaming, Memory Monitoring, Chunked Output');
  }
}
