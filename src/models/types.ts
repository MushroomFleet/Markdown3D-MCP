// Core NM3 types matching the specification exactly
export interface NM3Document {
  version: "1.0";
  meta: {
    title: string;
    created: string;
    modified?: string;
    author?: string;
    tags?: string;
    description?: string;
  };
  camera: {
    "position-x": number;
    "position-y": number;
    "position-z": number;
    "look-at-x": number;
    "look-at-y": number;
    "look-at-z": number;
    fov?: number;
  };
  nodes: NM3Node[];
  links: NM3Link[];
}

export interface NM3Node {
  id: string;
  type: "sphere" | "cube" | "cylinder" | "pyramid" | "torus";
  x: number;
  y: number;
  z: number;
  scale?: number;
  color?: string;
  title?: string;
  content: string; // Markdown content (will be wrapped in CDATA)
  tags?: string;
  "rotation-x"?: number;
  "rotation-y"?: number;
  "rotation-z"?: number;
}

export interface NM3Link {
  from: string;
  to: string;
  type?: "explores" | "leads-to" | "derives-from" | "relates" | 
         "contradicts" | "supports" | "contains" | "precedes" | 
         "enables" | "requires" | "questions" | "answers" | "exemplifies";
  color?: string;
  thickness?: number;
  curve?: number;
  animated?: boolean;
  dashed?: boolean;
}
