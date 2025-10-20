# Markdown3D MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0-blue.svg)](https://modelcontextprotocol.io)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/yourusername/markdown3d-mcp)
[![License](https://img.shields.io/badge/license-ISC-lightgrey.svg)](LICENSE)

> Transform markdown documents into immersive 3D visualizations using the NM3 format

Markdown3D MCP is a Model Context Protocol (MCP) server that intelligently converts markdown documents into three-dimensional spatial representations. Using semantic analysis, cross-reference detection, and optimized spatial layout algorithms, it creates navigable 3D knowledge structures that preserve document hierarchy and relationships.

## ✨ Features

- **🎯 Semantic Analysis** - Intelligent content classification using NLP to determine node types and relationships
- **🎨 Smart Color Mapping** - Context-aware color assignment based on content semantics and tone
- **📐 Geometric Intelligence** - Automatic shape selection based on content structure (spheres, cubes, cylinders, pyramids, tori)
- **🔗 Cross-Reference Detection** - Parses `[[node-id]]` patterns and builds relationship graphs
- **📏 Spatial Optimization** - Force-directed layout algorithms for readable 3D arrangements
- **⚡ Multi-Layer Caching** - LRU caches with intelligent eviction for sub-second repeat requests
- **📊 Streaming Processing** - Handle documents of any size with constant memory usage
- **🔄 Parallel Processing** - Worker thread pool for multi-core spatial optimization
- **📈 Performance Monitoring** - Prometheus metrics and detailed performance statistics
- **💾 Memory Management** - Automatic monitoring and garbage collection
- **✅ Strict Validation** - Ensures compliance with NM3 specification (16 colors, 5 shapes)
- **⚡ MCP Integration** - Seamless integration with Claude Desktop and other MCP clients
- **🧪 Comprehensive Testing** - Full test suite with validation and error handling

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [How It Works](#-how-it-works)
- [For Developers](#-for-developers)
- [NM3 Format](#-nm3-format)
- [Visualization](#-visualization)
- [Citation](#-citation)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Installation

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Claude Desktop (for MCP integration)

### Install from npm

```bash
npm install -g markdown3d-mcp
```

### Install from source

```bash
# Clone the repository
git clone https://github.com/yourusername/markdown3d-mcp.git
cd markdown3d-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Configure Claude Desktop

Add the server to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "markdown3d": {
      "command": "node",
      "args": ["/absolute/path/to/markdown3d-mcp/dist/index.js"]
    }
  }
}
```

### Verify Installation

```bash
# Run standalone test
npm run test

# Start development server
npm run dev
```

## ⚡ Quick Start

### Using with Claude Desktop

1. Restart Claude Desktop after configuration
2. Check the 🔌 MCP icon to verify "markdown3d" is connected
3. Use the transformation tool:

```
Please use the transform_to_nm3 tool to convert this markdown:

# My Research
## Key Findings
- Discovery 1
- Discovery 2
```

### Command Line Usage

```bash
# Transform a markdown file
node dist/index.js < input.md > output.nm3

# Run test client
npm run test
```

## 📖 Usage

### MCP Tools

#### `transform_to_nm3`

Transforms markdown content into NM3 3D visualization format with performance optimizations.

**Parameters:**
- `markdown` (required): Markdown content to transform
- `title` (optional): Document title override
- `author` (optional): Author name override
- `options` (optional): Performance options object
  - `useCache` (boolean, default: true): Enable multi-layer caching
  - `useStreaming` (boolean, default: true): Enable streaming for large documents
  - `chunkSize` (number, default: 1000): Lines per chunk for streaming

**Example:**
```json
{
  "markdown": "# Introduction\n\nThis is a test document.",
  "title": "Test Document",
  "author": "John Doe",
  "options": {
    "useCache": true,
    "useStreaming": true
  }
}
```

**Returns:** Valid NM3 XML string

**Performance Notes:**
- First request may take longer as caches warm up
- Identical markdown served from cache in <10ms
- Documents >50KB automatically use streaming
- Cache hit rate typically >80% after warmup

#### `validate_nm3`

Validates NM3 XML for compliance with the specification.

**Parameters:**
- `xml` (required): NM3 XML to validate

**Returns:** Validation result with success status and error details

#### `get_performance_stats`

Retrieves detailed performance and cache statistics from the server.

**Parameters:** None

**Returns:** Performance report including:
- Cache statistics (hits, misses, hit rates) for all cache layers
- Memory usage (heap, RSS, percentage)
- Prometheus metrics (transform duration, counts, etc.)

**Example Response:**
```markdown
# Performance Statistics

## Cache Stats
### parse
- Hits: 150
- Misses: 50
- Hit Rate: 75.00%
- Keys: 45

### transform
- Hits: 140
- Misses: 60
- Hit Rate: 70.00%
- Keys: 35

### xml
- Hits: 145
- Misses: 55
- Hit Rate: 72.50%
- Keys: 40

## Memory Stats
- Heap Used: 245.67MB
- Heap Total: 512.00MB
- Percent Used: 47.98%
- RSS: 385.23MB

## Prometheus Metrics
...
```

#### `clear_cache`

Clears all caches to free memory or reset performance state.

**Parameters:** None

**Returns:** Confirmation message

**Use Cases:**
- Free memory when approaching limits
- Reset cache state for testing
- Clear stale cached data
- Force fresh transformations

**Note:** After clearing cache, first requests will take longer as caches rebuild.

### API Usage

```typescript
import { MarkdownParser } from './core/parser.js';
import { SimpleTransformer } from './core/transformer.js';
import { NM3XMLBuilder } from './core/xml-builder.js';

// Parse markdown
const parser = new MarkdownParser();
const sections = parser.parse(markdownContent);

// Transform to NM3
const transformer = new SimpleTransformer();
const nm3Doc = transformer.transform(sections);

// Build XML
const xmlBuilder = new NM3XMLBuilder();
const xml = xmlBuilder.buildXML(nm3Doc);
```

## 🔧 How It Works

### Transformation Pipeline

```
Markdown → Parser → Semantic Analysis → Transformer → XML Builder → NM3
```

1. **Parsing**: Markdown is tokenized and structured into hierarchical sections
2. **Analysis**: Content is analyzed for semantic meaning, patterns, and relationships
3. **Transformation**: Sections are converted to 3D nodes with appropriate shapes, colors, and positions
4. **XML Generation**: Valid NM3 XML is built with proper CDATA wrapping and validation

### Color Mapping Rules

| Color | Semantic Meaning | Triggers |
|-------|-----------------|----------|
| `pastel-pink` | Urgent/Critical | error, warning, critical, urgent |
| `pastel-blue` | Information | main sections, documentation |
| `pastel-green` | Solutions/Success | solution, complete, done, success |
| `pastel-yellow` | Questions/Ideas | questions, how, why, what |
| `pastel-purple` | References/Sources | citation, reference, source, link |
| `pastel-orange` | Warnings/Attention | attention, caution, note |
| `pastel-mint` | Fresh Ideas | new, innovation, idea, proposal |
| `pastel-lavender` | Technical/Code | code blocks, technical content |
| `pastel-peach` | Personal Notes | subjective, opinion, note |
| `pastel-gray` | Archive/Deep Content | nested content, completed items |

### Shape Assignment Logic

| Shape | Usage | Best For |
|-------|-------|----------|
| 🔵 Sphere | Atomic concepts | Single ideas, definitions, standalone concepts |
| 📦 Cube | Structured data | Categories, tables, structured information |
| 🔄 Cylinder | Processes | Timelines, steps, sequential processes |
| 🔺 Pyramid | Hierarchies | Priority lists, organizational structures |
| 🍩 Torus | Cycles | Loops, feedback systems, continuous processes |

### Spatial Layout Strategy

- **Z-axis**: Importance/temporal ordering (important content forward)
- **Y-axis**: Abstraction levels (high-level concepts higher)
- **X-axis**: Categorical grouping (related content clustered)
- **Hierarchy**: Parent-child relationships via containment links
- **Spacing**: Dynamic based on node importance and relationships

## ⚡ Performance

### Key Performance Metrics

Markdown3D MCP is optimized for production workloads with Phase 4 performance enhancements:

| Metric | Target | Description |
|--------|--------|-------------|
| **Cached Requests** | <10ms | Repeat transformations served from cache |
| **Small Documents** | <500ms | Documents with <100 nodes, first request |
| **Medium Documents** | <2s | Documents with 100-1000 nodes |
| **Large Documents** | <5s | Documents with 1000-5000 nodes (with streaming) |
| **Memory Footprint** | <500MB | Under normal production load |
| **Cache Hit Rate** | >80% | After initial warmup period |

### Performance Features

#### Multi-Layer Caching System
- **Parse Cache**: 100MB LRU cache with 30-minute TTL for parsed markdown
- **Transform Cache**: 50MB LRU cache with 15-minute TTL for NM3 documents
- **XML Cache**: NodeCache with 100 keys and 10-minute TTL
- **SHA-256 Hashing**: Deterministic cache keys for reliable hit detection

#### Streaming Processing
- Automatic activation for documents >50KB
- Constant memory usage regardless of document size
- Line-by-line parsing with chunked processing
- Handles multi-GB documents efficiently

#### Parallel Processing
- Worker thread pool for CPU-intensive operations
- Multi-core spatial optimization
- Configurable worker count (default: CPU cores - 1)
- Automatic load balancing

#### Performance Monitoring
- Prometheus metrics integration
- Real-time cache hit/miss statistics
- Memory usage tracking
- Transform duration histograms
- Node count distributions

#### Memory Management
- Automatic monitoring every 30 seconds
- Warning threshold: 400MB heap usage
- Critical threshold: 800MB heap usage
- Automatic garbage collection on critical status
- Detailed memory statistics

### Optimization Guidelines

For best performance:

1. **Enable Caching**: Cache is enabled by default; ensure it's not disabled
2. **Reuse Content**: Identical markdown will be served from cache in <10ms
3. **Large Documents**: Documents >50KB automatically use streaming
4. **Memory Limits**: Monitor memory usage with `get_performance_stats` tool
5. **Clear Cache**: Use `clear_cache` tool if memory becomes constrained

## 👨‍💻 For Developers

### Project Structure

```
markdown3d-mcp/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server implementation
│   ├── core/
│   │   ├── parser.ts         # Markdown parsing
│   │   ├── transformer.ts    # Basic transformation
│   │   ├── enhanced-transformer.ts    # Advanced transformation (Phase 2)
│   │   ├── optimized-transformer.ts   # Performance-optimized transformer (Phase 4)
│   │   ├── xml-builder.ts    # NM3 XML generation
│   │   ├── reference-extractor.ts     # Cross-reference detection
│   │   ├── content-classifier.ts      # Semantic analysis
│   │   ├── intelligent-shape-assigner.ts
│   │   ├── intelligent-color-mapper.ts
│   │   ├── spatial-optimizer-v2.ts    # Spatial layout optimization (Phase 3)
│   │   ├── collision-detector.ts      # Collision detection (Phase 3)
│   │   ├── force-directed-3d.ts       # Force-directed layout (Phase 3)
│   │   ├── layout-templates.ts        # Layout templates (Phase 3)
│   │   ├── octree.ts                  # Octree spatial indexing (Phase 3)
│   │   ├── cache-manager.ts           # Multi-layer caching (Phase 4)
│   │   ├── stream-processor.ts        # Streaming processor (Phase 4)
│   │   ├── worker-pool.ts             # Worker thread pool (Phase 4)
│   │   ├── metrics.ts                 # Performance metrics (Phase 4)
│   │   └── memory-monitor.ts          # Memory management (Phase 4)
│   ├── models/
│   │   └── types.ts          # TypeScript interfaces
│   ├── constants/
│   │   └── validation.ts     # Valid colors and shapes
│   ├── utils/                # Utility functions
│   └── handlers/             # Additional handlers
├── docs/                     # Documentation
│   ├── Markdown3D-Phase0.md  # Overview
│   ├── Markdown3D-Phase1.md  # Foundation implementation
│   ├── Markdown3D-Phase2.md  # Advanced features
│   ├── Markdown3D-Phase3.md  # Spatial optimization
│   ├── Markdown3D-Phase4.md  # Performance & scalability
│   └── instruct/             # Detailed phase instructions
├── tests/                    # Test suite
├── output/                   # Generated NM3 files
└── specs/                    # NM3 specifications

```

### Development Workflow

```bash
# Install dependencies
npm install

# Development mode (watch for changes)
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Start MCP server
npm start
```

### Building From Source

```bash
# Clone repository
git clone https://github.com/yourusername/markdown3d-mcp.git
cd markdown3d-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build

# Test the build
node dist/index.js
```

### Development Phases

The project is organized into 6 development phases:

- **Phase 1**: Foundation & Basic Functionality ✅
  - Working MCP server with basic transformation
  - Strict validation (16 colors, 5 shapes)
  - Simple spatial positioning

- **Phase 2**: Advanced Parsing & Intelligence ✅
  - Cross-reference detection
  - Semantic analysis with NLP
  - Intelligent shape and color assignment
  - Relationship mapping

- **Phase 3**: Spatial Optimization ✅
  - Force-directed graph algorithms
  - Collision detection and resolution
  - Layout templates
  - Octree spatial indexing

- **Phase 4**: Performance & Scalability ✅
  - Multi-layer caching (parse, transform, XML)
  - Streaming processing for large documents
  - Worker thread pool for parallel processing
  - Performance monitoring with Prometheus metrics
  - Memory management with automatic GC
  - Optimized transformer with intelligent caching

- **Phase 5**: Testing & Quality Assurance (Planned)
  - Comprehensive test suite
  - Validation framework
  - Error recovery
  - Benchmark suite

- **Phase 6**: Production & Deployment (Planned)
  - Docker containerization
  - CI/CD pipelines
  - Monitoring and logging
  - Documentation

### Testing

```bash
# Run all tests
npm run test

# Test with specific markdown file
npm run test -- --file docs/test-book.md

# Validate NM3 output
node dist/index.js validate output/test.nm3
```

### Code Style

- TypeScript with strict mode enabled
- ESModules (`.js` imports required)
- Functional programming patterns preferred
- Comprehensive error handling
- Detailed logging for debugging

## 📐 NM3 Format

[NM3 (Navigable Markdown 3D)](https://github.com/MushroomFleet/NM3-nested-markdown-3d) is an XML-based format for representing documents in 3D space. Each document consists of:

- **Metadata**: Title, author, creation date, tags
- **Camera**: Initial viewpoint and field of view
- **Nodes**: 3D geometric shapes representing content
- **Links**: Relationships between nodes

### Key Features

- **16 Allowed Colors**: Pastel palette for visual harmony
- **5 Geometric Types**: Sphere, Cube, Cylinder, Pyramid, Torus
- **CDATA Content**: Preserves markdown formatting
- **Spatial Positioning**: 3D coordinates (x, y, z)
- **Link Types**: 13 semantic relationship types

### Specification

For the complete NM3 XML specification, see:
- [NM3 Format Specification](docs/nm3-spec.md) *(placeholder - link to your spec)*
- [Example NM3 Files](output/)

### Sample NM3 Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nm3 version="1.0">
  <meta title="Document Title" created="2025-01-01T00:00:00Z" author="Author"/>
  <camera position-x="0" position-y="10" position-z="20" 
          look-at-x="0" look-at-y="0" look-at-z="0" fov="75"/>
  <nodes>
    <node id="intro" type="sphere" x="0" y="0" z="0" 
          color="pastel-blue" scale="1.5">
      <title>Introduction</title>
      <content><![CDATA[# Introduction
This is the content...]]></content>
    </node>
  </nodes>
  <links>
    <link from="intro" to="chapter1" type="leads-to" color="pastel-gray"/>
  </links>
</nm3>
```

## 🎨 Visualization

### Viewing NM3 Files

To view the generated 3D visualizations, use the **Careless-Canvas-3D** application:

🔗 **[Careless-Canvas-3D Viewer](https://github.com/yourusername/careless-canvas-3d)** *(placeholder link)*

The Careless-Canvas-3D viewer provides:
- Interactive 3D navigation
- Node selection and content viewing
- Link traversal
- Multiple camera modes
- Export and sharing options

### Alternative Viewers

NM3 files can also be viewed with:
- Any XML-compatible 3D visualization tool
- Custom Three.js implementations
- VR/AR compatible viewers

### Screenshots

*(Add screenshots of visualized documents here)*

## 📚 Citation


### Related Projects

*(Placeholder for related NM3 works, inspirations, and acknowledgments)*


## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Fork and clone
git clone https://github.com/yourusername/markdown3d-mcp.git

# Create branch
git checkout -b feature/my-feature

# Install dependencies
npm install

# Make changes and test
npm run dev
npm run test

# Build
npm run build
```

### Code of Conduct

We follow the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and inclusive in all interactions.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **GitHub Repository**: [https://github.com/yourusername/markdown3d-mcp](https://github.com/yourusername/markdown3d-mcp)
- **NPM Package**: [https://www.npmjs.com/package/markdown3d-mcp](https://www.npmjs.com/package/markdown3d-mcp)
- **Documentation**: [https://markdown3d-docs.example.com](https://markdown3d-docs.example.com)
- **Issue Tracker**: [https://github.com/yourusername/markdown3d-mcp/issues](https://github.com/yourusername/markdown3d-mcp/issues)
- **MCP Protocol**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)

## 📚 Citation

### Academic Citation

If you use this codebase in your research or project, please cite:

```bibtex
@software{markdown3d_mcp,
  title = {Markdown3D MCP: MCP transforms MD into NM3 formatted xml},
  author = {[Drift Johnson]},
  year = {2025},
  url = {https://github.com/MushroomFleet/Markdown3D-MCP},
  version = {1.0.0}
}
```

### Donate:

[![Ko-Fi](https://cdn.ko-fi.com/cdn/kofi3.png?v=3)](https://ko-fi.com/driftjohnson)

---

**Made with ❤️ by the Markdown3D team**

*Transform your documents into navigable 3D knowledge spaces*


