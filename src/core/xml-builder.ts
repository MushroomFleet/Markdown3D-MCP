import { XMLBuilder, XMLValidator } from 'fast-xml-parser';
import { NM3Document } from '../models/types.js';
import { isValidColor, isValidShape, sanitizeColor } from '../constants/validation.js';

export class NM3XMLBuilder {
  private builder: XMLBuilder;

  constructor() {
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      indentBy: "  ",
      suppressEmptyNode: false,
      cdataPropName: "__cdata",
      attributeNamePrefix: "@_",
      textNodeName: "#text"
    });
  }

  buildXML(document: NM3Document): string {
    // Validate and fix any issues before building
    this.validateAndFix(document);
    
    // Build XML structure
    const xmlObj = {
      nm3: {
        "@_version": document.version,
        meta: this.buildMeta(document.meta),
        camera: this.buildCamera(document.camera),
        nodes: this.buildNodes(document.nodes),
        links: this.buildLinks(document.links)
      }
    };

    // Generate XML
    const xmlBody = this.builder.build(xmlObj);
    
    // Add XML declaration
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlBody;
  }

  private validateAndFix(document: NM3Document): void {
    // Fix any invalid colors or shapes
    for (const node of document.nodes) {
      if (node.color && !isValidColor(node.color)) {
        console.error(`Invalid color '${node.color}' for node '${node.id}', using default`);
        node.color = 'pastel-blue';
      }
      if (!isValidShape(node.type)) {
        console.error(`Invalid shape '${node.type}' for node '${node.id}', using sphere`);
        node.type = 'sphere';
      }
    }
    
    for (const link of document.links) {
      if (link.color && !isValidColor(link.color)) {
        link.color = 'pastel-gray';
      }
    }
  }

  private buildMeta(meta: any) {
    const attributes: any = {};
    if (meta.title) attributes['@_title'] = meta.title;
    if (meta.created) attributes['@_created'] = meta.created;
    if (meta.modified) attributes['@_modified'] = meta.modified;
    if (meta.author) attributes['@_author'] = meta.author;
    if (meta.tags) attributes['@_tags'] = meta.tags;
    if (meta.description) attributes['@_description'] = meta.description;
    return attributes;
  }

  private buildCamera(camera: any) {
    return {
      '@_position-x': camera['position-x'].toFixed(3),
      '@_position-y': camera['position-y'].toFixed(3),
      '@_position-z': camera['position-z'].toFixed(3),
      '@_look-at-x': camera['look-at-x'].toFixed(3),
      '@_look-at-y': camera['look-at-y'].toFixed(3),
      '@_look-at-z': camera['look-at-z'].toFixed(3),
      '@_fov': camera.fov || 75
    };
  }

  private buildNodes(nodes: any[]) {
    if (!nodes || nodes.length === 0) {
      return {};
    }

    const nodeElements = nodes.map(node => {
      const nodeObj: any = {
        '@_id': node.id,
        '@_type': node.type,
        '@_x': node.x.toFixed(3),
        '@_y': node.y.toFixed(3),
        '@_z': node.z.toFixed(3)
      };

      if (node.scale) nodeObj['@_scale'] = node.scale.toFixed(2);
      if (node.color) nodeObj['@_color'] = sanitizeColor(node.color);
      if (node['rotation-x']) nodeObj['@_rotation-x'] = node['rotation-x'].toFixed(3);
      if (node['rotation-y']) nodeObj['@_rotation-y'] = node['rotation-y'].toFixed(3);
      if (node['rotation-z']) nodeObj['@_rotation-z'] = node['rotation-z'].toFixed(3);

      // Add child elements
      if (node.title) {
        nodeObj.title = node.title;
      }

      // Content with CDATA
      nodeObj.content = {
        "__cdata": node.content
      };

      if (node.tags) {
        nodeObj.tags = node.tags;
      }

      return nodeObj;
    });

    return { node: nodeElements };
  }

  private buildLinks(links: any[]) {
    if (!links || links.length === 0) {
      return {};
    }

    const linkElements = links.map(link => {
      const linkObj: any = {
        '@_from': link.from,
        '@_to': link.to
      };

      if (link.type) linkObj['@_type'] = link.type;
      if (link.color) linkObj['@_color'] = sanitizeColor(link.color);
      if (link.thickness) linkObj['@_thickness'] = link.thickness;
      if (link.curve) linkObj['@_curve'] = link.curve.toFixed(2);
      // Note: animated and dashed are boolean attributes not supported in NM3 XML format

      return linkObj;
    });

    return { link: linkElements };
  }

  validateXML(xml: string): { valid: boolean; error?: string } {
    const result = XMLValidator.validate(xml);
    if (result === true) {
      return { valid: true };
    } else {
      return { valid: false, error: result.err?.msg };
    }
  }
}
