/**
 * Token Parser — parses tokens.json and resolves all references.
 *
 * Exports: TokenParser class
 *   - parse(json)        — build internal lookup maps
 *   - resolve(value)     — resolve a single reference string to its raw value
 *   - getPrimitives()    — colour, dimension, font, opacity primitives
 *   - getSemantics()     — colour, typography, dimension semantics
 *   - getComponents()    — every Components/* token set
 */

class TokenParser {
  constructor() {
    /** Flat map: dotted path → { value, type, description } */
    this.tokens = {};
    /** Raw JSON for structural iteration */
    this.raw = null;
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  parse(json) {
    this.raw = json;
    this.tokens = {};

    for (const setName of Object.keys(json)) {
      if (setName === '$metadata' || setName === '$themes') continue;
      this._flatten(json[setName], '', setName);
    }
  }

  /**
   * Resolve a value string that may contain {references}.
   * Returns the final raw value (string, number, or object for composites).
   */
  resolve(value, depth = 0) {
    if (depth > 15) return value; // guard infinite loops

    if (value === null || value === undefined) return value;

    // Composite object (typography, shadow)
    if (typeof value === 'object' && !Array.isArray(value)) {
      const resolved = {};
      for (const [k, v] of Object.entries(value)) {
        resolved[k] = this.resolve(v, depth + 1);
      }
      return resolved;
    }

    if (typeof value !== 'string') return value;

    // Single reference: "{some.path}"
    const refMatch = value.match(/^\{(.+)\}$/);
    if (refMatch) {
      const path = refMatch[1];
      const entry = this._lookup(path);
      if (entry) return this.resolve(entry.value, depth + 1);
      return value; // unresolved
    }

    return value;
  }

  /**
   * Return the reference path (e.g. "colour.brand.yellow.9") if value is a
   * single reference string, otherwise null.
   */
  getRef(value) {
    if (typeof value !== 'string') return null;
    const m = value.match(/^\{(.+)\}$/);
    return m ? m[1] : null;
  }

  /* ------------------------------------------------------------------ */
  /*  Structured getters                                                 */
  /* ------------------------------------------------------------------ */

  getPrimitives() {
    const p = this.raw['Core/primatives'];
    if (!p) return {};
    return {
      colours: p.colour || {},
      dimension: p.dimension || {},
      fontWeight: p.fontWeight || {},
      lineHeight: p.lineHeight || {},
      fontSize: p.fontSize || {},
      fontFamily: p.fontFamily || {},
      textDecoration: p.textDecoration || {},
      textCase: p.textCase || {},
      opacity: p.opacity || {},
      letterSpacing: p.letterSpacing || {},
    };
  }

  getSemanticColours() {
    const s = this.raw['Semantics/Colour'];
    return s ? s.colour || {} : {};
  }

  getSemanticTypography() {
    const s = this.raw['Semantics/Typography'];
    return s ? s.typography || {} : {};
  }

  getSemanticDimensions() {
    const s = this.raw['Semantics/Dimensions'];
    return s || {};
  }

  getComponents() {
    const out = {};
    for (const key of Object.keys(this.raw)) {
      if (key.startsWith('Components/')) {
        const name = key.replace('Components/', '');
        out[name] = this.raw[key];
      }
    }
    return out;
  }

  /* ------------------------------------------------------------------ */
  /*  Internal helpers                                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Recursively flatten a nested object into dotted-path entries.
   * A "leaf" token has a `value` key.
   */
  _flatten(obj, prefix, setName) {
    if (!obj || typeof obj !== 'object') return;

    // Leaf token?
    if ('value' in obj) {
      const path = prefix;
      this.tokens[path] = {
        value: obj.value,
        type: obj.type || '',
        description: (obj.description || '').trim(),
        set: setName,
      };
      return;
    }

    for (const [key, child] of Object.entries(obj)) {
      const next = prefix ? `${prefix}.${key}` : key;
      this._flatten(child, next, setName);
    }
  }

  /**
   * Look up a dotted path, trying multiple set prefixes.
   * Reference paths in tokens.json omit the set prefix,
   * so we search across all known tokens.
   */
  _lookup(path) {
    // Direct match
    if (this.tokens[path]) return this.tokens[path];

    // Try common prefixes
    const prefixes = [
      'colour.',
      'dimension.',
      'fontWeight.',
      'lineHeight.',
      'fontSize.',
      'fontFamily.',
      'textDecoration.',
      'textCase.',
      'opacity.',
      'letterSpacing.',
      'typography.',
      'sizing.',
      'spacing.',
      'borderWidth.',
      'borderRadius.',
    ];
    for (const px of prefixes) {
      if (this.tokens[px + path]) return this.tokens[px + path];
    }
    return null;
  }
}
