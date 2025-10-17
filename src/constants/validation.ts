// Exactly 16 allowed colors from NM3 spec
export const VALID_COLORS = [
  'pastel-pink',    // Urgent/Important
  'pastel-blue',    // Information/Research
  'pastel-green',   // Solutions/Actions  
  'pastel-yellow',  // Questions/Ideas
  'pastel-purple',  // References/Sources
  'pastel-orange',  // Warnings/Attention
  'pastel-mint',    // Fresh ideas/New thoughts
  'pastel-lavender',// Creative/Imaginative
  'pastel-peach',   // Personal notes
  'pastel-sky',     // Context/Background
  'pastel-rose',    // Emotional/Subjective
  'pastel-lime',    // Experimental/Testing
  'pastel-coral',   // Related/Connected
  'pastel-lilac',   // Abstract/Theoretical
  'pastel-cream',   // Documentation
  'pastel-gray'     // Archive/Completed
] as const;

// Exactly 5 allowed geometric types
export const VALID_SHAPES = [
  'sphere',   // Atomic concepts, single ideas
  'cube',     // Structured info, categories
  'cylinder', // Processes, timelines
  'pyramid',  // Hierarchies, priorities
  'torus'     // Cycles, loops
] as const;

export const LINK_TYPES = [
  'explores', 'leads-to', 'derives-from', 'relates',
  'contradicts', 'supports', 'contains', 'precedes',
  'enables', 'requires', 'questions', 'answers', 'exemplifies'
] as const;

export function isValidColor(color: string): boolean {
  return VALID_COLORS.includes(color as any);
}

export function isValidShape(shape: string): boolean {
  return VALID_SHAPES.includes(shape as any);
}

export function sanitizeColor(color?: string): string {
  if (!color || !isValidColor(color)) {
    return 'pastel-blue'; // Default safe color
  }
  return color;
}

export function sanitizeShape(shape?: string): string {
  if (!shape || !isValidShape(shape)) {
    return 'sphere'; // Default safe shape
  }
  return shape as any;
}
