import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface ChunkMetadata {
  chunkId: string;
  sequence: number;
  size: number;
  hash: string;
  startOffset: number;
  endOffset: number;
}

export interface ChunkManifest {
  documentId: string;
  totalChunks: number;
  totalSize: number;
  chunkSize: number;
  created: string;
  chunks: ChunkMetadata[];
  outputPath: string;
  sourceHash: string;
  workingDirectory?: string;
}

export interface ChunkResult {
  manifestPath: string;
  chunkCount: number;
  tempDir: string;
  manifest: ChunkManifest;
}

export class ChunkManager {
  private readonly chunkSize: number;
  private readonly tempDir: string;

  constructor(chunkSize: number = 30000, tempDir?: string) {
    this.chunkSize = chunkSize;
    this.tempDir = tempDir || path.join(process.cwd(), 'temp', 'chunks');
  }

  async chunkXML(
    xml: string,
    outputName: string = 'output.nm3',
    workingDirectory?: string
  ): Promise<ChunkResult> {
    // Create unique document ID
    const documentId = this.generateDocumentId();
    
    // Create temporary directory
    const docTempDir = path.join(this.tempDir, documentId);
    await fs.mkdir(docTempDir, { recursive: true });

    console.error(`📦 Chunking XML (${xml.length} chars) into ${this.chunkSize} char segments...`);

    // Split into chunks with XML-aware boundaries
    const chunks = this.splitXMLIntoChunks(xml);
    
    console.error(`   Created ${chunks.length} chunks`);

    // Write chunks and collect metadata
    const chunkMetadata: ChunkMetadata[] = [];
    let offset = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `chunk-${String(i + 1).padStart(3, '0')}`;
      const chunkPath = path.join(docTempDir, `${chunkId}.xml`);
      
      // Write chunk to disk
      await fs.writeFile(chunkPath, chunk, 'utf-8');
      
      // Calculate hash
      const hash = crypto.createHash('sha256').update(chunk).digest('hex');
      
      // Store metadata
      chunkMetadata.push({
        chunkId,
        sequence: i + 1,
        size: chunk.length,
        hash,
        startOffset: offset,
        endOffset: offset + chunk.length,
      });
      
      offset += chunk.length;
      
      console.error(`   ✓ ${chunkId}: ${chunk.length} chars (hash: ${hash.substring(0, 8)}...)`);
    }

    // Create manifest
    const manifest: ChunkManifest = {
      documentId,
      totalChunks: chunks.length,
      totalSize: xml.length,
      chunkSize: this.chunkSize,
      created: new Date().toISOString(),
      chunks: chunkMetadata,
      outputPath: outputName,
      sourceHash: crypto.createHash('sha256').update(xml).digest('hex'),
      workingDirectory,
    };

    // Write manifest
    const manifestPath = path.join(docTempDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    
    console.error(`   ✓ Manifest written: ${manifestPath}`);
    console.error(`   📊 Total: ${chunks.length} chunks, ${xml.length} chars`);

    return {
      manifestPath,
      chunkCount: chunks.length,
      tempDir: docTempDir,
      manifest,
    };
  }

  private splitXMLIntoChunks(xml: string): string[] {
    const chunks: string[] = [];
    let position = 0;
    
    while (position < xml.length) {
      // Calculate end position for this chunk
      let endPosition = Math.min(position + this.chunkSize, xml.length);
      
      // If not at end of document, find safe break point
      if (endPosition < xml.length) {
        // Look back for a newline to avoid splitting lines
        let safeEndPosition = endPosition;
        
        // Search backwards up to 1000 chars to find a newline
        for (let i = 0; i < 1000 && endPosition - i > position; i++) {
          if (xml[endPosition - i] === '\n') {
            safeEndPosition = endPosition - i + 1; // Include the newline
            break;
          }
        }
        
        // Verify we're not in middle of XML tag
        const chunkContent = xml.substring(position, safeEndPosition);
        if (this.isSafeBreakPoint(chunkContent)) {
          endPosition = safeEndPosition;
        }
        // If not safe, use original position (might split a line but won't split tags)
      }
      
      // Extract chunk
      const chunk = xml.substring(position, endPosition);
      chunks.push(chunk);
      
      position = endPosition;
    }
    
    return chunks;
  }

  private isSafeBreakPoint(chunk: string): boolean {
    // Check if we're not in the middle of an XML tag
    const openTags = (chunk.match(/</g) || []).length;
    const closeTags = (chunk.match(/>/g) || []).length;
    
    // Safe if tags are balanced
    return openTags === closeTags;
  }

  async assembleChunks(manifestPath: string, outputDirectory?: string): Promise<string> {
    console.error(`🔨 Assembling chunks from manifest: ${manifestPath}`);
    
    // Read manifest
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest: ChunkManifest = JSON.parse(manifestContent);
    
    const tempDir = path.dirname(manifestPath);
    
    console.error(`   Document ID: ${manifest.documentId}`);
    console.error(`   Total chunks: ${manifest.totalChunks}`);
    console.error(`   Expected size: ${manifest.totalSize} chars`);

    // Read and concatenate chunks in order
    let assembledXML = '';
    
    for (const chunkMeta of manifest.chunks) {
      const chunkPath = path.join(tempDir, `${chunkMeta.chunkId}.xml`);
      
      // Read chunk
      const chunkContent = await fs.readFile(chunkPath, 'utf-8');
      
      // Verify hash
      const actualHash = crypto.createHash('sha256').update(chunkContent).digest('hex');
      if (actualHash !== chunkMeta.hash) {
        throw new Error(
          `Chunk ${chunkMeta.chunkId} hash mismatch! ` +
          `Expected: ${chunkMeta.hash}, Got: ${actualHash}`
        );
      }
      
      // Verify size
      if (chunkContent.length !== chunkMeta.size) {
        throw new Error(
          `Chunk ${chunkMeta.chunkId} size mismatch! ` +
          `Expected: ${chunkMeta.size}, Got: ${chunkContent.length}`
        );
      }
      
      assembledXML += chunkContent;
      
      console.error(`   ✓ ${chunkMeta.chunkId}: ${chunkMeta.size} chars (verified)`);
    }

    // Verify final assembly
    if (assembledXML.length !== manifest.totalSize) {
      throw new Error(
        `Assembled size mismatch! Expected: ${manifest.totalSize}, Got: ${assembledXML.length}`
      );
    }

    const assembledHash = crypto.createHash('sha256').update(assembledXML).digest('hex');
    if (assembledHash !== manifest.sourceHash) {
      throw new Error(
        `Assembled hash mismatch! Expected: ${manifest.sourceHash}, Got: ${assembledHash}`
      );
    }

    console.error(`   ✅ Assembly verified: ${assembledXML.length} chars`);
    
    // Determine output directory priority:
    // 1. Explicit outputDirectory parameter
    // 2. Manifest's workingDirectory (captured during chunking)
    // 3. Fall back to process.cwd()
    const outputDir = outputDirectory || manifest.workingDirectory || process.cwd();
    const outputPath = path.join(outputDir, manifest.outputPath);
    
    if (manifest.workingDirectory) {
      console.error(`   📁 Using captured working directory: ${manifest.workingDirectory}`);
    } else if (!outputDirectory) {
      console.error(`   ⚠️  No working directory in manifest, using: ${outputDir}`);
    }
    
    await fs.writeFile(outputPath, assembledXML, 'utf-8');
    
    console.error(`   💾 Written to: ${outputPath}`);

    // Cleanup temp directory
    await this.cleanup(tempDir);

    return outputPath;
  }

  async cleanup(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.error(`   🗑️  Cleaned up temp directory: ${tempDir}`);
    } catch (error) {
      console.error(`   ⚠️  Warning: Could not cleanup ${tempDir}:`, error);
    }
  }

  private generateDocumentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `doc-${timestamp}-${random}`;
  }

  async getChunkStatus(manifestPath: string): Promise<{
    exists: boolean;
    chunksPresent: number;
    totalChunks: number;
    missingChunks: string[];
  }> {
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: ChunkManifest = JSON.parse(manifestContent);
      
      const tempDir = path.dirname(manifestPath);
      const missingChunks: string[] = [];
      let chunksPresent = 0;
      
      for (const chunkMeta of manifest.chunks) {
        const chunkPath = path.join(tempDir, `${chunkMeta.chunkId}.xml`);
        try {
          await fs.access(chunkPath);
          chunksPresent++;
        } catch {
          missingChunks.push(chunkMeta.chunkId);
        }
      }
      
      return {
        exists: true,
        chunksPresent,
        totalChunks: manifest.totalChunks,
        missingChunks,
      };
    } catch {
      return {
        exists: false,
        chunksPresent: 0,
        totalChunks: 0,
        missingChunks: [],
      };
    }
  }
}
