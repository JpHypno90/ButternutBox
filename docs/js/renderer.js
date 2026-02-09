/**
 * Renderer — generates HTML for each storybook section.
 *
 * Every render* function returns a DOM element (or HTML string)
 * that app.js appends to the content area.
 */

const Renderer = {

  /* ================================================================== */
  /*  1. COLOUR PRIMITIVES                                               */
  /* ================================================================== */

  renderColourPrimitives(colours) {
    const section = el('section', 'section');
    section.id = 'colours';
    section.appendChild(heading('Colour Primitives'));

    const renderScale = (scaleName, scale) => {
      const group = el('div', 'colour-scale');
      const title = el('h3', 'scale-title');
      title.textContent = scaleName;
      group.appendChild(title);

      const row = el('div', 'swatch-row');
      for (const [step, token] of Object.entries(scale)) {
        if (typeof token !== 'object' || !token.value) continue;
        const swatch = el('div', 'swatch');
        const preview = el('div', 'swatch-preview');
        preview.style.backgroundColor = token.value;
        // light text for dark swatches
        const lum = approxLuminance(token.value);
        const meta = el('div', 'swatch-meta');
        meta.innerHTML = `<span class="swatch-step">${step}</span>
          <span class="swatch-hex" style="color:${lum < 0.4 ? '#fff' : '#000'}">${escHtml(token.value)}</span>`;
        preview.appendChild(meta);
        if (token.description) {
          const desc = el('div', 'swatch-desc');
          desc.textContent = token.description;
          swatch.appendChild(preview);
          swatch.appendChild(desc);
        } else {
          swatch.appendChild(preview);
        }
        row.appendChild(swatch);
      }
      group.appendChild(row);
      return group;
    };

    // Brand colours
    if (colours.brand) {
      const brandHeading = el('h2', 'subsection-title');
      brandHeading.textContent = 'Brand';
      section.appendChild(brandHeading);
      for (const [name, scale] of Object.entries(colours.brand)) {
        section.appendChild(renderScale(name, scale));
      }
    }
    // System colours
    if (colours.system) {
      const sysHeading = el('h2', 'subsection-title');
      sysHeading.textContent = 'System';
      section.appendChild(sysHeading);
      for (const [name, scale] of Object.entries(colours.system)) {
        section.appendChild(renderScale(name, scale));
      }
    }
    return section;
  },

  /* ================================================================== */
  /*  2. COLOUR SEMANTICS                                                */
  /* ================================================================== */

  renderColourSemantics(semanticColours, parser) {
    const section = el('section', 'section');
    section.id = 'colour-semantics';
    section.appendChild(heading('Colour Semantics'));

    const categories = ['background', 'text', 'border', 'icon', 'illustrations', 'shadow'];

    for (const cat of categories) {
      const data = semanticColours[cat];
      if (!data) continue;

      const group = el('div', 'semantic-group');
      const title = el('h2', 'subsection-title');
      title.textContent = cat;
      group.appendChild(title);

      const table = el('table', 'token-table');
      table.innerHTML = '<thead><tr><th>Token</th><th>Reference</th><th>Resolved</th><th></th></tr></thead>';
      const tbody = el('tbody');

      flattenTokens(data, cat, (path, token) => {
        if (token.type === 'boxShadow') {
          // shadow composite
          const tr = el('tr');
          const resolved = parser.resolve(token.value);
          tr.innerHTML = `<td class="token-path">${escHtml(path)}</td>
            <td class="token-ref">${escHtml(summariseRef(token.value))}</td>
            <td class="token-resolved">${escHtml(shadowToCSS(resolved))}</td>
            <td><div class="shadow-preview" style="box-shadow:${shadowToCSS(resolved)}"></div></td>`;
          tbody.appendChild(tr);
        } else {
          const ref = parser.getRef(token.value);
          const resolved = parser.resolve(token.value);
          const tr = el('tr');
          tr.innerHTML = `<td class="token-path">${escHtml(path)}</td>
            <td class="token-ref">${ref ? escHtml(ref) : '—'}</td>
            <td class="token-resolved">${escHtml(String(resolved))}</td>
            <td>${isColour(resolved) ? `<div class="inline-swatch" style="background:${resolved}"></div>` : ''}</td>`;
          tbody.appendChild(tr);
        }
      });

      table.appendChild(tbody);
      group.appendChild(table);
      section.appendChild(group);
    }
    return section;
  },

  /* ================================================================== */
  /*  3. SPACING & SIZING                                                */
  /* ================================================================== */

  renderSpacingSizing(dimension, semanticDim, parser) {
    const section = el('section', 'section');
    section.id = 'spacing-sizing';
    section.appendChild(heading('Spacing & Sizing'));

    const renderScale = (title, obj, maxPx) => {
      const group = el('div', 'dimension-group');
      const h = el('h2', 'subsection-title');
      h.textContent = title;
      group.appendChild(h);

      for (const [step, token] of Object.entries(obj)) {
        if (typeof token !== 'object' || !token.value) continue;
        const resolved = parser.resolve(token.value);
        const px = parseInt(String(resolved), 10) || 0;
        const row = el('div', 'dim-row');
        const bar = el('div', 'dim-bar');
        bar.style.width = Math.min(px, maxPx || 400) + 'px';
        const label = el('span', 'dim-label');
        const ref = parser.getRef(token.value);
        label.textContent = `${step} — ${resolved}${ref ? '  (' + ref + ')' : ''}`;
        row.appendChild(bar);
        row.appendChild(label);
        group.appendChild(row);
      }
      return group;
    };

    if (dimension.spacing) {
      section.appendChild(renderScale('Spacing Primitives', dimension.spacing, 400));
    }
    if (dimension.sizing) {
      section.appendChild(renderScale('Sizing Primitives', dimension.sizing, 500));
    }

    // Semantic spacing / sizing
    if (semanticDim.spacing) {
      section.appendChild(renderScale('Spacing Semantics', semanticDim.spacing, 400));
    }
    if (semanticDim.sizing) {
      section.appendChild(renderScale('Sizing Semantics', semanticDim.sizing, 500));
    }

    return section;
  },

  /* ================================================================== */
  /*  4. TYPOGRAPHY                                                      */
  /* ================================================================== */

  renderTypography(primitives, semanticTypo, parser) {
    const section = el('section', 'section');
    section.id = 'typography';
    section.appendChild(heading('Typography'));

    // Font families
    const famGroup = el('div', 'typo-group');
    const famTitle = el('h2', 'subsection-title');
    famTitle.textContent = 'Font Families';
    famGroup.appendChild(famTitle);
    if (primitives.fontFamily && primitives.fontFamily.brand) {
      const bb = primitives.fontFamily.brand.butternutbox || {};
      for (const [role, token] of Object.entries(bb)) {
        const sample = el('div', 'font-sample');
        const resolved = typeof token === 'object' ? token.value : token;
        sample.style.fontFamily = `"${resolved}", sans-serif`;
        sample.innerHTML = `<span class="font-role">${escHtml(role)}</span>
          <span class="font-name">${escHtml(resolved)}</span>
          <span class="font-preview" style="font-family:'${resolved}',sans-serif">The quick brown fox jumps over the lazy dog</span>`;
        famGroup.appendChild(sample);
      }
    }
    section.appendChild(famGroup);

    // Font weights
    if (primitives.fontWeight && Object.keys(primitives.fontWeight).length) {
      const wGroup = el('div', 'typo-group');
      const wTitle = el('h2', 'subsection-title');
      wTitle.textContent = 'Font Weights';
      wGroup.appendChild(wTitle);
      const row = el('div', 'weight-row');
      for (const [step, token] of Object.entries(primitives.fontWeight)) {
        const val = typeof token === 'object' ? token.value : token;
        const chip = el('div', 'weight-chip');
        chip.style.fontWeight = val;
        chip.innerHTML = `<span class="weight-num">${escHtml(step)}</span><span class="weight-preview" style="font-weight:${val}">Aa</span>`;
        row.appendChild(chip);
      }
      wGroup.appendChild(row);
      section.appendChild(wGroup);
    }

    // Font sizes
    if (primitives.fontSize && Object.keys(primitives.fontSize).length) {
      const sGroup = el('div', 'typo-group');
      const sTitle = el('h2', 'subsection-title');
      sTitle.textContent = 'Font Sizes';
      sGroup.appendChild(sTitle);
      for (const [step, token] of Object.entries(primitives.fontSize)) {
        const val = typeof token === 'object' ? token.value : token;
        const px = parseInt(val, 10);
        const row = el('div', 'fontsize-row');
        row.innerHTML = `<span class="fontsize-label">${escHtml(step)} — ${escHtml(String(val))}</span>
          <span class="fontsize-preview" style="font-size:${px}px">The quick brown fox</span>`;
        sGroup.appendChild(row);
      }
      section.appendChild(sGroup);
    }

    // Semantic typography composites
    if (semanticTypo) {
      const cGroup = el('div', 'typo-group');
      const cTitle = el('h2', 'subsection-title');
      cTitle.textContent = 'Typography Tokens';
      cGroup.appendChild(cTitle);

      flattenTokens(semanticTypo, '', (path, token) => {
        if (token.type !== 'typography' && typeof token.value !== 'object') return;
        const resolved = parser.resolve(token.value);
        if (typeof resolved !== 'object') return;

        const card = el('div', 'typo-card');
        const style = buildTypoStyle(resolved);
        card.innerHTML = `<div class="typo-card-name">${escHtml(path)}</div>
          <div class="typo-card-props">${escHtml(typoProps(resolved))}</div>
          <div class="typo-card-preview" style="${style}">The quick brown fox jumps over the lazy dog</div>`;
        cGroup.appendChild(card);
      });
      section.appendChild(cGroup);
    }

    return section;
  },

  /* ================================================================== */
  /*  5. BORDER RADIUS & WIDTH                                           */
  /* ================================================================== */

  renderBorders(dimension, semanticDim, parser) {
    const section = el('section', 'section');
    section.id = 'borders';
    section.appendChild(heading('Border Radius & Width'));

    // Radius primitives
    if (dimension.radius) {
      const group = el('div', 'border-group');
      const title = el('h2', 'subsection-title');
      title.textContent = 'Radius Primitives';
      group.appendChild(title);
      const row = el('div', 'radius-row');
      for (const [step, token] of Object.entries(dimension.radius)) {
        const val = typeof token === 'object' ? token.value : token;
        const px = parseInt(val, 10);
        const chip = el('div', 'radius-chip');
        chip.innerHTML = `<div class="radius-preview" style="border-radius:${px}px"></div>
          <span class="radius-label">${escHtml(step)} — ${escHtml(String(val))}</span>`;
        row.appendChild(chip);
      }
      group.appendChild(row);
      section.appendChild(group);
    }

    // Semantic radius
    if (semanticDim.borderRadius) {
      const group = el('div', 'border-group');
      const title = el('h2', 'subsection-title');
      title.textContent = 'Radius Semantics';
      group.appendChild(title);
      const row = el('div', 'radius-row');
      for (const [step, token] of Object.entries(semanticDim.borderRadius)) {
        if (typeof token !== 'object' || !token.value) continue;
        const resolved = parser.resolve(token.value);
        const ref = parser.getRef(token.value);
        const px = parseInt(String(resolved), 10);
        const chip = el('div', 'radius-chip');
        chip.innerHTML = `<div class="radius-preview" style="border-radius:${px}px"></div>
          <span class="radius-label">${escHtml(step)} — ${escHtml(String(resolved))}${ref ? ' (' + escHtml(ref) + ')' : ''}</span>`;
        row.appendChild(chip);
      }
      group.appendChild(row);
      section.appendChild(group);
    }

    // Border width
    if (semanticDim.borderWidth) {
      const group = el('div', 'border-group');
      const title = el('h2', 'subsection-title');
      title.textContent = 'Border Width';
      group.appendChild(title);
      const row = el('div', 'radius-row');
      for (const [step, token] of Object.entries(semanticDim.borderWidth)) {
        if (typeof token !== 'object' || !token.value) continue;
        const resolved = parser.resolve(token.value);
        const ref = parser.getRef(token.value);
        const px = parseInt(String(resolved), 10);
        const chip = el('div', 'radius-chip');
        chip.innerHTML = `<div class="border-width-preview" style="border-width:${px}px"></div>
          <span class="radius-label">${escHtml(step)} — ${escHtml(String(resolved))}${ref ? ' (' + escHtml(ref) + ')' : ''}</span>`;
        row.appendChild(chip);
      }
      group.appendChild(row);
      section.appendChild(group);
    }

    return section;
  },

  /* ================================================================== */
  /*  6. OPACITY                                                         */
  /* ================================================================== */

  renderOpacity(opacityTokens, parser) {
    const section = el('section', 'section');
    section.id = 'opacity';
    section.appendChild(heading('Opacity'));

    const row = el('div', 'opacity-row');
    for (const [step, token] of Object.entries(opacityTokens)) {
      if (typeof token !== 'object' || !token.value) continue;
      const val = parseFloat(token.value);
      const chip = el('div', 'opacity-chip');
      chip.innerHTML = `<div class="opacity-preview">
          <div class="opacity-checker"></div>
          <div class="opacity-fill" style="opacity:${val}"></div>
        </div>
        <span class="opacity-label">${escHtml(step)} — ${token.value}</span>`;
      row.appendChild(chip);
    }
    section.appendChild(row);
    return section;
  },

  /* ================================================================== */
  /*  7. COMPONENT TOKENS                                                */
  /* ================================================================== */

  renderComponent(name, data, parser) {
    const section = el('section', 'section component-section');
    section.id = 'component-' + slugify(name);
    section.appendChild(heading(name));

    // Interactive preview (if builder exists)
    if (typeof Previews !== 'undefined' && PREVIEW_MAP[name]) {
      try {
        const preview = Previews[PREVIEW_MAP[name]](data, parser);
        if (preview) {
          const previewContainer = el('div', 'component-preview');
          const previewTitle = el('h2', 'subsection-title');
          previewTitle.textContent = 'Preview';
          previewContainer.appendChild(previewTitle);
          previewContainer.appendChild(preview);
          section.appendChild(previewContainer);
        }
      } catch (e) {
        console.warn(`Preview failed for ${name}:`, e);
      }
    }

    // Token table toggle
    const toggleBtn = el('button', 'token-table-toggle');
    toggleBtn.textContent = 'Show token table';
    toggleBtn.addEventListener('click', () => {
      const isHidden = tableWrap.style.display === 'none';
      tableWrap.style.display = isHidden ? 'block' : 'none';
      toggleBtn.textContent = isHidden ? 'Hide token table' : 'Show token table';
    });
    section.appendChild(toggleBtn);

    const tableWrap = el('div', 'token-table-wrap');
    tableWrap.style.display = 'none';

    const table = el('table', 'token-table');
    table.innerHTML = '<thead><tr><th>Token Path</th><th>Type</th><th>Reference</th><th>Resolved</th><th></th></tr></thead>';
    const tbody = el('tbody');

    flattenTokens(data, '', (path, token) => {
      const ref = parser.getRef(token.value);
      const resolved = parser.resolve(token.value);
      const isTypo = token.type === 'typography' || (typeof resolved === 'object' && resolved.fontFamily);
      const isShadow = token.type === 'boxShadow';

      const tr = el('tr');
      let resolvedStr, previewHtml;

      if (isTypo) {
        resolvedStr = typoProps(resolved);
        previewHtml = `<span style="${buildTypoStyle(resolved)}">Aa</span>`;
      } else if (isShadow) {
        const css = shadowToCSS(typeof resolved === 'object' ? resolved : token.value);
        resolvedStr = css;
        previewHtml = `<div class="shadow-preview" style="box-shadow:${css}"></div>`;
      } else if (isColour(resolved)) {
        resolvedStr = String(resolved);
        previewHtml = `<div class="inline-swatch" style="background:${resolved}"></div>`;
      } else {
        resolvedStr = String(resolved);
        const px = parseInt(resolvedStr, 10);
        if (!isNaN(px) && px > 0 && px <= 500 && (token.type === 'spacing' || token.type === 'sizing' || token.type === 'dimension' || token.type === 'borderRadius' || token.type === 'borderWidth')) {
          previewHtml = `<div class="dim-bar-inline" style="width:${Math.min(px, 120)}px"></div>`;
        } else {
          previewHtml = '';
        }
      }

      tr.innerHTML = `<td class="token-path">${escHtml(path)}</td>
        <td class="token-type">${escHtml(token.type || '')}</td>
        <td class="token-ref">${ref ? escHtml(ref) : typeof token.value === 'object' ? summariseRef(token.value) : escHtml(String(token.value))}</td>
        <td class="token-resolved">${escHtml(resolvedStr)}</td>
        <td>${previewHtml}</td>`;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    section.appendChild(tableWrap);
    return section;
  },
};

/* ==================================================================== */
/*  Utility helpers                                                      */
/* ==================================================================== */

function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function heading(text) {
  const h = document.createElement('h1');
  h.className = 'section-heading';
  h.textContent = text;
  return h;
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Recursively walk a token group, calling fn(path, leafToken) */
function flattenTokens(obj, prefix, fn) {
  if (!obj || typeof obj !== 'object') return;
  if ('value' in obj) {
    fn(prefix, obj);
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    flattenTokens(v, prefix ? prefix + '.' + k : k, fn);
  }
}

/** Quick luminance estimate for hex colours */
function approxLuminance(colour) {
  if (!colour || typeof colour !== 'string') return 1;
  const hex = colour.replace('#', '');
  if (hex.length < 6) return 1;
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isColour(v) {
  if (typeof v !== 'string') return false;
  return /^#[0-9a-f]{3,8}$/i.test(v) || /^rgba?\(/.test(v);
}

function buildTypoStyle(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const parts = [];
  if (obj.fontFamily) parts.push(`font-family:"${obj.fontFamily}",sans-serif`);
  if (obj.fontWeight) parts.push(`font-weight:${obj.fontWeight}`);
  if (obj.fontSize) parts.push(`font-size:${parseInt(obj.fontSize, 10)}px`);
  if (obj.lineHeight) parts.push(`line-height:${parseInt(obj.lineHeight, 10)}px`);
  if (obj.textDecoration && obj.textDecoration !== 'none') parts.push(`text-decoration:${obj.textDecoration}`);
  if (obj.textCase && obj.textCase !== 'none') parts.push(`text-transform:${obj.textCase}`);
  return parts.join(';');
}

function typoProps(obj) {
  if (!obj || typeof obj !== 'object') return String(obj);
  const parts = [];
  if (obj.fontFamily) parts.push(obj.fontFamily);
  if (obj.fontWeight) parts.push('w' + obj.fontWeight);
  if (obj.fontSize) parts.push(obj.fontSize);
  if (obj.lineHeight) parts.push('/' + obj.lineHeight);
  return parts.join(' ');
}

function shadowToCSS(v) {
  if (typeof v === 'string') return v;
  if (typeof v !== 'object') return '';
  const px = n => parseInt(String(n || '0'), 10);
  const x = px(v.x);
  const y = px(v.y);
  const blur = px(v.blur);
  const spread = px(v.spread);
  const color = v.color || 'rgba(0,0,0,0.1)';
  return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
}

function summariseRef(value) {
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);
  return Object.entries(value)
    .map(([k, v]) => k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)))
    .join(', ');
}
