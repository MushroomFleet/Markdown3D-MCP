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
git clone https://github.com/MushroomFleet/Markdown3D-MCP
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

Transforms markdown content into NM3 3D visualization format.

**Parameters:**
- `markdown` (required): Markdown content to transform
- `title` (optional): Document title override
- `author` (optional): Author name override

**Example:**
```json
{
  "markdown": "# Introduction\n\nThis is a test document.",
  "title": "Test Document",
  "author": "John Doe"
}
```

**Returns:** Valid NM3 XML string

#### `validate_nm3`

Validates NM3 XML for compliance with the specification.

**Parameters:**
- `xml` (required): NM3 XML to validate

**Returns:** Validation result with success status and error details

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
│   │   ├── enhanced-transformer.ts  # Advanced transformation (Phase 2)
│   │   ├── xml-builder.ts    # NM3 XML generation
│   │   ├── reference-extractor.ts   # Cross-reference detection
│   │   ├── content-classifier.ts    # Semantic analysis
│   │   ├── intelligent-shape-assigner.ts
│   │   └── intelligent-color-mapper.ts
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
git clone https://github.com/MushroomFleet/Markdown3D-MCP
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

- **Phase 3**: Spatial Optimization (Planned)
  - Force-directed graph algorithms
  - Collision detection and resolution
  - Layout templates
  - Octree spatial indexing

- **Phase 4**: Performance & Scalability (Planned)
  - Streaming processing for large documents
  - Caching system
  - Parallel processing
  - Memory optimization

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

NM3 (Navigable Markdown 3D) is an XML-based format for representing documents in 3D space. Each document consists of:

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

🔗 **[Careless-Canvas-3D Viewer](https://github.com/MushroomFleet/careless-canvas-3d)** *(placeholder link)*

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

### Academic Citation

If you use Markdown3D MCP in your research, please cite:

```bibtex
@software{markdown3d_mcp,
  title = {Markdown3D MCP: Semantic 3D Document Visualization},
  author = {[Drift Johnson]},
  year = {2025},
  url = {https://github.com/MushroomFleet/markdown3d-mcp},
  version = {1.0.0}
}
```

### Related Projects

- Agentic System Prompt (MD to NM3) - [CHUNGUS-3D](https://github.com/MushroomFleet/CHUNGUS-nested-markdown-3D), tested with Sonnet and Haiku 4.5
- NM3 Nested Markdown 3D xml standard - [NM3 Specification](https://github.com/MushroomFleet/NM3-nested-markdown-3d).
- Careless Canvas 3D (NM3/NML) - Main Editing Suite for NM3 formatted xml
- 3D Perplexity Search Graph (NM3) - Coming Soon.

Special thanks to:
- Organizations or individuals who supported the project
- Inspirational projects or papers
- Community contributors

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

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/markdown3d-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/markdown3d-mcp/discussions)
- **Email**: support@example.com *(placeholder)*

---

**Made with ❤️ by the Markdown3D team**

*Transform your documents into navigable 3D knowledge spaces*



