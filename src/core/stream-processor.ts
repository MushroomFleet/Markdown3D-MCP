import { Transform } from 'stream';
import split2 from 'split2';
import through2 from 'through2';
import { ParsedSection } from './parser.js';

export interface StreamChunk {
  type: 'heading' | 'content' | 'code' | 'list' | 'table';
  level?: number;
  text: string;
  lineNumber: number;
}

export class StreamingMarkdownParser {
  private currentSection: Partial<ParsedSection> | null = null;
  private sectionBuffer: string[] = [];
  private lineNumber: number = 0;
  private sections: ParsedSection[] = [];

  createParseStream(): Transform {
    return through2.obj((line: string, enc, callback) => {
      this.lineNumber++;
      this.processLine(line);
      callback();
    });
  }

  private processLine(line: string): void {
    // Check if line is a heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      // Save previous section if exists
      if (this.currentSection) {
        this.finalizeSection();
      }

      // Start new section
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      
      this.currentSection = {
        id: this.generateId(title),
        title,
        level,
        children: [],
        metadata: {
          hasCode: false,
          hasList: false,
          hasTable: false,
          wordCount: 0,
          isQuestion: title.includes('?'),
        },
      };
      this.sectionBuffer = [];
    } else {
      // Accumulate content
      if (this.currentSection) {
        this.sectionBuffer.push(line);
        
        // Update metadata
        if (line.startsWith('```')) {
          this.currentSection.metadata!.hasCode = true;
        }
        if (/^[\s]*[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
          this.currentSection.metadata!.hasList = true;
        }
        if (line.includes('|')) {
          this.currentSection.metadata!.hasTable = true;
        }
      }
    }
  }

  private finalizeSection(): void {
    if (!this.currentSection) return;

    const content = this.sectionBuffer.join('\n').trim();
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    const section: ParsedSection = {
      id: this.currentSection.id!,
      title: this.currentSection.title!,
      level: this.currentSection.level!,
      content,
      originalMarkdown: content,
      children: [],
      metadata: {
        ...this.currentSection.metadata!,
        wordCount,
      },
    };

    this.sections.push(section);
  }

  getResults(): ParsedSection[] {
    // Finalize last section
    if (this.currentSection) {
      this.finalizeSection();
    }

    return this.sections;
  }

  private generateId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
  }
}

export class ChunkedProcessor {
  async processLargeMarkdown(
    markdown: string,
    chunkSize: number = 1000
  ): Promise<ParsedSection[]> {
    const lines = markdown.split('\n');
    const chunks: string[][] = [];
    
    // Split into chunks
    for (let i = 0; i < lines.length; i += chunkSize) {
      chunks.push(lines.slice(i, i + chunkSize));
    }

    // Process chunks
    const allSections: ParsedSection[] = [];
    
    for (const chunk of chunks) {
      const parser = new StreamingMarkdownParser();
      const stream = parser.createParseStream();
      
      // Properly await stream completion
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', (err) => reject(err));
        
        // Push lines through stream
        for (const line of chunk) {
          stream.write(line);
        }
        stream.end();
      });
      
      const sections = parser.getResults();
      allSections.push(...sections);
    }

    return allSections;
  }
}
