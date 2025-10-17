import { marked } from 'marked';

export interface ParsedSection {
  id: string;
  title: string;
  level: number;
  content: string;
  originalMarkdown: string;
  parent?: string;
  children: string[];
  metadata: {
    hasCode: boolean;
    hasList: boolean;
    hasTable: boolean;
    wordCount: number;
    isQuestion: boolean;
  };
}

export class MarkdownParser {
  private sections: ParsedSection[] = [];
  private idCounter = 0;

  parse(markdown: string): ParsedSection[] {
    this.sections = [];
    this.idCounter = 0;
    
    // Parse with marked to get tokens
    const tokens = marked.lexer(markdown);
    
    let currentSection: ParsedSection | null = null;
    let contentBuffer: string[] = [];
    let markdownBuffer: string[] = [];
    const sectionStack: ParsedSection[] = [];

    for (const token of tokens) {
      if (token.type === 'heading') {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = contentBuffer.join('\n').trim();
          currentSection.originalMarkdown = markdownBuffer.join('\n').trim();
          this.analyzeMetadata(currentSection);
          this.sections.push(currentSection);
        }

        // Create new section
        const id = this.generateId(token.text);
        currentSection = {
          id,
          title: token.text,
          level: token.depth,
          content: '',
          originalMarkdown: '',
          children: [],
          metadata: {
            hasCode: false,
            hasList: false,
            hasTable: false,
            wordCount: 0,
            isQuestion: false
          }
        };

        // Manage hierarchy
        while (sectionStack.length > 0 && 
               sectionStack[sectionStack.length - 1].level >= token.depth) {
          sectionStack.pop();
        }
        
        if (sectionStack.length > 0) {
          const parent = sectionStack[sectionStack.length - 1];
          currentSection.parent = parent.id;
          parent.children.push(id);
        }
        
        sectionStack.push(currentSection);
        contentBuffer = [];
        markdownBuffer = [token.raw];
      } else {
        // Accumulate content
        if (token.raw) {
          markdownBuffer.push(token.raw);
        }
        if (token.type === 'paragraph' || token.type === 'text') {
          contentBuffer.push(token.raw || token.text || '');
        } else if (token.type === 'code') {
          contentBuffer.push(token.text);
        } else if (token.type === 'list') {
          contentBuffer.push(this.listToText(token));
        } else if (token.type === 'table') {
          contentBuffer.push(this.tableToText(token));
        }
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = contentBuffer.join('\n').trim();
      currentSection.originalMarkdown = markdownBuffer.join('\n').trim();
      this.analyzeMetadata(currentSection);
      this.sections.push(currentSection);
    }

    // If no sections found, create one from entire content
    if (this.sections.length === 0 && markdown.trim()) {
      const section: ParsedSection = {
        id: 'main',
        title: 'Document',
        level: 1,
        content: markdown,
        originalMarkdown: markdown,
        children: [],
        metadata: {
          hasCode: markdown.includes('```'),
          hasList: /^[\s]*[-*+]\s/m.test(markdown) || /^\d+\.\s/m.test(markdown),
          hasTable: markdown.includes('|'),
          wordCount: markdown.split(/\s+/).length,
          isQuestion: markdown.includes('?')
        }
      };
      this.sections.push(section);
    }

    return this.sections;
  }

  private generateId(title: string): string {
    // Clean title for use as ID
    const base = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    // Ensure uniqueness
    let id = base || `section-${this.idCounter}`;
    let counter = 1;
    while (this.sections.some(s => s.id === id)) {
      id = `${base}-${counter}`;
      counter++;
    }
    
    this.idCounter++;
    return id;
  }

  private analyzeMetadata(section: ParsedSection): void {
    const content = section.content + ' ' + section.title;
    section.metadata.hasCode = section.originalMarkdown.includes('```');
    section.metadata.hasList = /^[\s]*[-*+]\s/m.test(section.originalMarkdown);
    section.metadata.hasTable = section.originalMarkdown.includes('|');
    section.metadata.wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    section.metadata.isQuestion = content.includes('?');
  }

  private listToText(token: any): string {
    const items: string[] = [];
    if (token.items) {
      for (const item of token.items) {
        items.push('- ' + (item.text || ''));
      }
    }
    return items.join('\n');
  }

  private tableToText(token: any): string {
    // Simple table to text conversion
    let text = '';
    if (token.header) {
      text += token.header.map((h: any) => h.text).join(' | ') + '\n';
    }
    if (token.rows) {
      for (const row of token.rows) {
        text += row.map((cell: any) => cell.text).join(' | ') + '\n';
      }
    }
    return text;
  }
}
