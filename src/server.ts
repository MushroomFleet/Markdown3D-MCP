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

export class Markdown3DServer {
  private server: Server;
  private transformer: OptimizedTransformer;
  private xmlBuilder: NM3XMLBuilder;
  private memoryMonitor: MemoryMonitor;
  private metrics: MetricsCollector;

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
          description: 'Transform markdown to NM3 with caching and streaming support for large documents',
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
    console.error('Markdown3D MCP v3.0 - Performance Engine Ready');
    console.error('✨ Features: Caching, Streaming, Memory Monitoring');
  }
}
