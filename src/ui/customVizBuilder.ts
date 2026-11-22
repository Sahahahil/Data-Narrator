
export interface EncodingChannel {
  field: string;
  type: 'quantitative' | 'temporal' | 'nominal' | 'ordinal';
  title?: string;
  scale?: { type: 'linear' | 'log' | 'time' | 'utc' };
  axis?: { format: string };
}

export type Transform =
  | { filter: string }
  | { aggregate: string; groupby: string[] }
  | { calculate: string; as: string };

export interface CustomVizSpec {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  mark: 'bar' | 'line' | 'area' | 'point' | 'rect' | 'arc';
  encoding: {
    x: EncodingChannel;
    y: EncodingChannel;
    color?: EncodingChannel;
    size?: EncodingChannel;
    tooltip?: EncodingChannel[];
  };
  transform?: Transform[];
  config?: { view?: { stroke: null } };
}

export interface VegaLiteSpec {
  $schema?: string;
  data: { values: unknown[] };
  mark: string;
  encoding: Record<string, unknown>;
  transform?: Transform[];
  config?: { view?: { stroke: null } };
}

const STORAGE_KEY = 'datastoryteller_custom_viz';

export class CustomVizBuilder {
  private specs: Map<string, CustomVizSpec> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const specs = JSON.parse(stored);
        for (const spec of specs) {
          this.specs.set(spec.id, spec);
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }

  private saveToStorage(): void {
    try {
      const specs = Array.from(this.specs.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(specs));
    } catch {
      // Ignore storage errors
    }
  }

  registerSpec(spec: CustomVizSpec): void {
    this.specs.set(spec.id, spec);
    this.saveToStorage();
  }

  getSpec(id: string): CustomVizSpec | undefined {
    return this.specs.get(id);
  }

  listSpecs(): CustomVizSpec[] {
    return Array.from(this.specs.values());
  }

  deleteSpec(id: string): void {
    this.specs.delete(id);
    this.saveToStorage();
  }

  // Generate Vega-Lite spec for rendering
  toVegaLite(spec: CustomVizSpec, data: unknown[]): VegaLiteSpec {
    const encoding: Record<string, unknown> = {};

    // X encoding
    encoding['x'] = {
      field: spec.encoding.x.field,
      type: spec.encoding.x.type,
      title: spec.encoding.x.title,
      scale: spec.encoding.x.scale,
      axis: spec.encoding.x.axis,
    };

    // Y encoding
    encoding['y'] = {
      field: spec.encoding.y.field,
      type: spec.encoding.y.type,
      title: spec.encoding.y.title,
      scale: spec.encoding.y.scale,
      axis: spec.encoding.y.axis,
    };

    // Color encoding
    if (spec.encoding.color) {
      encoding['color'] = {
        field: spec.encoding.color.field,
        type: spec.encoding.color.type,
        title: spec.encoding.color.title,
        scale: spec.encoding.color.scale,
      };
    }

    // Size encoding
    if (spec.encoding.size) {
      encoding['size'] = {
        field: spec.encoding.size.field,
        type: spec.encoding.size.type,
        title: spec.encoding.size.title,
        scale: spec.encoding.size.scale,
      };
    }

    // Tooltip encoding
    if (spec.encoding.tooltip && spec.encoding.tooltip.length > 0) {
      encoding['tooltip'] = spec.encoding.tooltip.map(t => ({
        field: t.field,
        type: t.type,
        title: t.title,
      }));
    }

    
    const vegaSpec: VegaLiteSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      mark: spec.mark,
      encoding,
      transform: spec.transform,
      config: {
        view: { stroke: null },
      },
    };

    if (spec.transform) {
      vegaSpec.transform = spec.transform;
    }

    return vegaSpec;
  }

  validateSpec(spec: Partial<CustomVizSpec>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!spec.name || spec.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!spec.mark) {
      errors.push('Mark type is required');
    }

    if (!spec.encoding?.x?.field) {
      errors.push('X encoding field is required');
    }

    if (!spec.encoding?.y?.field) {
      errors.push('Y encoding field is required');
    }

    if (!spec.encoding?.x?.type) {
      errors.push('X encoding type is required');
    }

    if (!spec.encoding?.y?.type) {
      errors.push('Y encoding type is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Singleton instance
export const customVizBuilder = new CustomVizBuilder();