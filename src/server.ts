#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { EnhancedTransformer } from './core/enhanced-transformer.js';
import { NM3XMLBuilder } from './core/xml-builder.js';

export class Markdown3DServer {
  private server: Server;
  private transformer: EnhancedTransformer;
  private xmlBuilder: NM3XMLBuilder;

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

    this.transformer = new EnhancedTransformer();
    this.xmlBuilder = new NM3XMLBuilder();
    
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'transform_to_nm3',
          description: 'Transform markdown to NM3 with intelligent semantic analysis, cross-reference detection, and optimized spatial layout',
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
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'transform_to_nm3': {
            const { markdown, title, author } = args as any;
            
            // Use enhanced transformer (async)
            console.error('Starting intelligent transformation...');
            const nm3Doc = await this.transformer.transform(markdown);
            
            // Override metadata if provided
            if (title) nm3Doc.meta.title = title;
            if (author) nm3Doc.meta.author = author;
            
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
    console.error('Markdown3D MCP v2.0 - Intelligence Engine Ready');
  }
}
