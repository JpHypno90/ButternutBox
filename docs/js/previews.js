/**
 * Previews — interactive component previews built from resolved tokens.
 *
 * Each build* function takes (componentData, parser) and returns a DOM element
 * showing the live component with tokens applied as inline styles.
 *
 * Helper: r(path) resolves a token reference path to its final value.
 */

const Previews = {

  /* ── Helper: deep-get a value from nested token data ─────────── */
  _dig(obj, path) {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (!cur || typeof cur !== 'object') return undefined;
      cur = cur[p];
    }
    return cur;
  },

  _val(obj, path, parser) {
    const node = this._dig(obj, path);
    if (!node) return undefined;
    if (typeof node === 'object' && 'value' in node) return parser.resolve(node.value);
    return undefined;
  },

  _typo(obj, path, parser) {
    const node = this._dig(obj, path);
    if (!node || typeof node !== 'object') return '';
    const v = node.value ? parser.resolve(node.value) : parser.resolve(node);
    if (typeof v !== 'object') return '';
    const parts = [];
    if (v.fontFamily) parts.push(`font-family:"${v.fontFamily}",sans-serif`);
    if (v.fontWeight) parts.push(`font-weight:${v.fontWeight}`);
    if (v.fontSize) parts.push(`font-size:${parseInt(v.fontSize,10)}px`);
    if (v.lineHeight) parts.push(`line-height:${parseInt(v.lineHeight,10)}px`);
    if (v.textDecoration && v.textDecoration !== 'none') parts.push(`text-decoration:${v.textDecoration}`);
    return parts.join(';');
  },

  _px(v) { return parseInt(String(v),10) || 0; },

  /* ================================================================ */
  /*  1. BUTTONS                                                       */
  /* ================================================================ */
  buildButtons(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    // Shared sizing/spacing
    const sizes = ['lg','md','sm'];
    const typoStyle = this._typo(data, 'text.button.primary.default', parser);
    const radius = px('button.borderRadius.default');
    const opacity = parseFloat(v('button.opacity.disabled') || '0.5');

    // ── Filled buttons (primary + secondary) ──
    for (const variant of ['primary','secondary']) {
      const row = _el('div','preview-row');
      const label = _el('div','preview-label');
      label.textContent = `Filled Button — ${variant}`;
      row.appendChild(label);

      const bg = v(`filledButton.colour.background.${variant}.default`);
      const bgHover = v(`filledButton.colour.background.${variant}.hover`);
      const bgDisabled = v(`filledButton.colour.background.${variant}.disabled`);
      const textCol = v(`filledButton.colour.text.${variant}.default`);

      for (const sz of sizes) {
        const h = px(`button.size.${sz}.height`);
        const hPad = px(`button.spacing.${sz}.horizontalPadding`);
        const vPad = px(`button.spacing.${sz}.verticalPadding`);
        const gap = px(`button.spacing.${sz}.gap`);

        for (const state of ['default','hover','disabled']) {
          const btn = _el('button','preview-btn');
          const bgC = state === 'hover' ? bgHover : state === 'disabled' ? bgDisabled : bg;
          btn.style.cssText = `
            height:${h}px;padding:${vPad}px ${hPad}px;border-radius:${radius}px;
            background:${bgC};color:${textCol};border:none;cursor:pointer;
            gap:${gap}px;display:inline-flex;align-items:center;justify-content:center;
            min-width:${px(`button.size.${sz}.minWidth`)}px;${typoStyle};
            ${state === 'disabled' ? `opacity:${opacity};pointer-events:none` : ''}`;
          btn.textContent = `${sz.toUpperCase()} ${state}`;
          if (state === 'hover') {
            btn.setAttribute('data-hover-bg', bgHover);
            btn.setAttribute('data-default-bg', bg);
            _addHover(btn, bgHover, bg);
          }
          row.appendChild(btn);
        }
      }
      wrap.appendChild(row);
    }

    // ── Outline button ──
    {
      const row = _el('div','preview-row');
      const label = _el('div','preview-label');
      label.textContent = 'Outline Button';
      row.appendChild(label);

      const borderCol = v('outlineButton.colour.border.default');
      const textCol = v('outlineButton.colour.text.default');
      const bgHover = v('outlineButton.colour.background.hover');
      const borderW = px('outlineButton.border.default');

      for (const sz of sizes) {
        const h = px(`button.size.${sz}.height`);
        const hPad = px(`button.spacing.${sz}.horizontalPadding`);
        const btn = _el('button','preview-btn');
        btn.style.cssText = `
          height:${h}px;padding:0 ${hPad}px;border-radius:${radius}px;
          background:transparent;color:${textCol};
          border:${borderW}px solid ${borderCol};cursor:pointer;
          display:inline-flex;align-items:center;justify-content:center;
          min-width:${px(`button.size.${sz}.minWidth`)}px;${typoStyle}`;
        btn.textContent = sz.toUpperCase();
        _addHover(btn, bgHover, 'transparent', true);
        row.appendChild(btn);
      }
      wrap.appendChild(row);
    }

    // ── Text button ──
    {
      const row = _el('div','preview-row');
      const label = _el('div','preview-label');
      label.textContent = 'Text Button';
      row.appendChild(label);

      const textCol = v('textButton.text.default');
      const bgHover = v('textButton.background.hover');

      for (const sz of sizes) {
        const h = px(`button.size.${sz}.height`);
        const hPad = px(`button.spacing.${sz}.horizontalPadding`);
        const btn = _el('button','preview-btn');
        btn.style.cssText = `
          height:${h}px;padding:0 ${hPad}px;border-radius:${radius}px;
          background:transparent;color:${textCol};border:none;cursor:pointer;
          display:inline-flex;align-items:center;justify-content:center;${typoStyle}`;
        btn.textContent = sz.toUpperCase();
        _addHover(btn, bgHover, 'transparent', true);
        row.appendChild(btn);
      }
      wrap.appendChild(row);
    }

    // ── Icon buttons (filled/outline/text) ──
    {
      const row = _el('div','preview-row');
      const label = _el('div','preview-label');
      label.textContent = 'Icon Buttons';
      row.appendChild(label);

      // Filled primary
      const ibBg = v('iconButton.filledButton.colour.background.primary.default');
      const ibIcon = v('iconButton.filledButton.colour.icon.primary.default');
      const h = px('button.size.md.height');
      const ibBtn1 = _el('button','preview-btn preview-icon-btn');
      ibBtn1.style.cssText = `width:${h}px;height:${h}px;border-radius:${radius}px;background:${ibBg};color:${ibIcon};border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:20px`;
      ibBtn1.innerHTML = '&#9733;';
      row.appendChild(ibBtn1);

      // Outline
      const ibBorder = v('iconButton.outlineButton.colour.border.default');
      const ibIconOut = v('iconButton.outlineButton.colour.icon.default');
      const ibBw = px('iconButton.outlineButton.border.default');
      const ibBtn2 = _el('button','preview-btn preview-icon-btn');
      ibBtn2.style.cssText = `width:${h}px;height:${h}px;border-radius:${radius}px;background:transparent;color:${ibIconOut};border:${ibBw}px solid ${ibBorder};cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:20px`;
      ibBtn2.innerHTML = '&#9733;';
      row.appendChild(ibBtn2);

      // Text
      const ibIconTxt = v('iconButton.textButton.icon.default');
      const ibBtn3 = _el('button','preview-btn preview-icon-btn');
      ibBtn3.style.cssText = `width:${h}px;height:${h}px;border-radius:${radius}px;background:transparent;color:${ibIconTxt};border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:20px`;
      ibBtn3.innerHTML = '&#9733;';
      row.appendChild(ibBtn3);

      wrap.appendChild(row);
    }

    return wrap;
  },

  /* ================================================================ */
  /*  2. ICONS                                                         */
  /* ================================================================ */
  buildIcons(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);

    const categories = [
      { name: 'Core', prefix: 'sizing.icons.core', steps: ['xs','sm','md','lg','xl'] },
      { name: 'Marketing', prefix: 'sizing.icons.marketing', steps: ['xs','sm','md','lg','xl','2xl'] },
      { name: 'Payments', prefix: 'sizing.icons.payments', steps: ['sm'] },
      { name: 'Flags', prefix: 'sizing.icons.flags', steps: ['sm','lg'] },
    ];

    for (const cat of categories) {
      const row = _el('div','preview-row');
      const label = _el('div','preview-label');
      label.textContent = cat.name;
      row.appendChild(label);

      for (const step of cat.steps) {
        const size = this._px(v(`${cat.prefix}.${step}`));
        const box = _el('div','preview-icon-box');
        box.style.cssText = `width:${size}px;height:${size}px`;
        box.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>`;
        const lbl = _el('span','preview-icon-label');
        lbl.textContent = `${step} (${size}px)`;
        const item = _el('div','preview-icon-item');
        item.appendChild(box);
        item.appendChild(lbl);
        row.appendChild(item);
      }
      wrap.appendChild(row);
    }
    return wrap;
  },

  /* ================================================================ */
  /*  3. ILLUSTRATIONS                                                 */
  /* ================================================================ */
  buildIllustrations(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const row = _el('div','preview-row');
    for (const step of ['sm','lg']) {
      const size = this._px(v(`sizing.illustrations.${step}`));
      const box = _el('div','preview-illus-box');
      box.style.cssText = `width:${size}px;height:${size}px;border-radius:8px;background:var(--yellow-3);display:flex;align-items:center;justify-content:center`;
      box.innerHTML = `<svg viewBox="0 0 24 24" width="${size*0.6}" height="${size*0.6}" fill="var(--brown-9)"><rect x="2" y="2" width="20" height="20" rx="3"/></svg>`;
      const lbl = _el('div','preview-icon-label');
      lbl.textContent = `${step} (${size}px)`;
      const item = _el('div','preview-icon-item');
      item.appendChild(box);
      item.appendChild(lbl);
      row.appendChild(item);
    }
    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  4. RADIO                                                         */
  /* ================================================================ */
  buildRadio(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const controlSize = px('radio.size.control.default');
    const indicatorSize = px('radio.size.indicator.default');
    const borderW = px('radio.borderWidth.default');
    const gap = px('radio.spacing.gap');
    const contentGap = px('radio.spacing.content.gap');

    const borderDefault = v('radio.colour.control.border.default');
    const borderSelected = v('radio.colour.control.border.selected');
    const indicatorBg = v('radio.colour.indicator.background.default');
    const indicatorSelected = v('radio.colour.indicator.background.selected');
    const textTitle = v('radio.colour.text.title');
    const textSub = v('radio.colour.text.subtext');

    // Unselected
    const row = _el('div','preview-row');
    row.style.gap = '32px';

    for (const selected of [false, true]) {
      const item = _el('div','preview-radio-item');
      item.style.cssText = `display:flex;align-items:flex-start;gap:${gap}px;cursor:pointer`;

      const control = _el('div','preview-radio-control');
      control.style.cssText = `width:${controlSize}px;height:${controlSize}px;border-radius:50%;
        border:${borderW}px solid ${selected ? borderSelected : borderDefault};
        background:${indicatorBg};display:flex;align-items:center;justify-content:center;flex-shrink:0`;

      if (selected) {
        const dot = _el('div');
        dot.style.cssText = `width:${indicatorSize}px;height:${indicatorSize}px;border-radius:50%;background:${indicatorSelected}`;
        control.appendChild(dot);
      }

      const textWrap = _el('div');
      textWrap.style.cssText = `display:flex;flex-direction:column;gap:${contentGap}px`;
      const title = _el('div');
      title.style.cssText = `color:${textTitle};font-weight:600;font-size:16px`;
      title.textContent = selected ? 'Selected option' : 'Unselected option';
      const sub = _el('div');
      sub.style.cssText = `color:${textSub};font-size:14px`;
      sub.textContent = 'Supporting text here';

      textWrap.appendChild(title);
      textWrap.appendChild(sub);
      item.appendChild(control);
      item.appendChild(textWrap);
      row.appendChild(item);
    }

    // Radio tile
    const tileRow = _el('div','preview-row');
    const tileLabel = _el('div','preview-label');
    tileLabel.textContent = 'Radio Tile';
    tileRow.appendChild(tileLabel);

    for (const selected of [false, true]) {
      const tileBg = v(`radioTile.colour.background.${selected ? 'selected' : 'default'}`);
      const tileBorder = v(`radioTile.colour.border.${selected ? 'selected' : 'default'}`);
      const tileBW = px(`radioTile.borderWidth.${selected ? 'selected' : 'default'}`);
      const tileRadius = px('radioTile.borderRadius.default');
      const tilePadH = px('radioTile.spacing.horizontalPadding');
      const tilePadV = px('radioTile.spacing.verticalPadding');
      const tileGap = px('radioTile.spacing.gap');

      const tile = _el('div','preview-tile');
      tile.style.cssText = `
        padding:${tilePadV}px ${tilePadH}px;border-radius:${tileRadius}px;
        border:${tileBW}px solid ${tileBorder};background:${tileBg};
        display:flex;align-items:center;gap:${tileGap}px;min-width:200px;cursor:pointer`;

      const ctrl = _el('div');
      ctrl.style.cssText = `width:${controlSize}px;height:${controlSize}px;border-radius:50%;
        border:${borderW}px solid ${selected ? borderSelected : borderDefault};
        background:${indicatorBg};display:flex;align-items:center;justify-content:center;flex-shrink:0`;
      if (selected) {
        const dot = _el('div');
        dot.style.cssText = `width:${indicatorSize}px;height:${indicatorSize}px;border-radius:50%;background:${indicatorSelected}`;
        ctrl.appendChild(dot);
      }

      const txt = _el('div');
      txt.style.cssText = `color:${textTitle};font-weight:600;font-size:16px`;
      txt.textContent = selected ? 'Selected tile' : 'Default tile';

      tile.appendChild(ctrl);
      tile.appendChild(txt);
      tileRow.appendChild(tile);
    }

    wrap.appendChild(row);
    wrap.appendChild(tileRow);
    return wrap;
  },

  /* ================================================================ */
  /*  5. CHECKBOX                                                      */
  /* ================================================================ */
  buildCheckbox(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const controlSize = px('checkbox.size.control.default');
    const borderW = px('checkbox.control.border.default');
    const gap = px('checkbox.spacing.gap');
    const contentGap = px('checkbox.spacing.content.gap');
    const borderCol = v('checkbox.colour.border.default');
    const bgSelected = v('checkbox.colour.background.selected');
    const iconCol = v('checkbox.colour.icon.default');
    const textTitle = v('checkbox.colour.text.title');
    const textSub = v('checkbox.colour.text.subtext');

    const row = _el('div','preview-row');
    row.style.gap = '32px';

    for (const selected of [false, true]) {
      const item = _el('div');
      item.style.cssText = `display:flex;align-items:flex-start;gap:${gap}px;cursor:pointer`;

      const control = _el('div');
      control.style.cssText = `width:${controlSize}px;height:${controlSize}px;border-radius:4px;
        border:${borderW}px solid ${selected ? bgSelected : borderCol};
        background:${selected ? bgSelected : 'transparent'};
        display:flex;align-items:center;justify-content:center;flex-shrink:0`;

      if (selected) {
        const check = _el('span');
        check.style.cssText = `color:${iconCol};font-size:16px;line-height:1`;
        check.textContent = '\u2713';
        control.appendChild(check);
      }

      const textWrap = _el('div');
      textWrap.style.cssText = `display:flex;flex-direction:column;gap:${contentGap}px`;
      const title = _el('div');
      title.style.cssText = `color:${textTitle};font-weight:600;font-size:16px`;
      title.textContent = selected ? 'Checked' : 'Unchecked';
      const sub = _el('div');
      sub.style.cssText = `color:${textSub};font-size:14px`;
      sub.textContent = 'Description text';

      textWrap.appendChild(title);
      textWrap.appendChild(sub);
      item.appendChild(control);
      item.appendChild(textWrap);
      row.appendChild(item);
    }

    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  6. SWITCH                                                        */
  /* ================================================================ */
  buildSwitch(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const w = px('switch.size.control.width');
    const h = px('switch.size.control.height');
    const thumbSize = px('switch.size.thumb.default');
    const borderW = px('switch.borderWidth.control');
    const gap = px('switch.spacing.gap');

    const row = _el('div','preview-row');
    row.style.gap = '32px';

    for (const on of [false, true]) {
      const bgCol = v(`switch.colour.control.background.${on ? 'selected' : 'default'}`);
      const borderCol = v('switch.colour.control.border');
      const thumbCol = v(`switch.colour.thumb.background.${on ? 'selected' : 'default'}`);

      const item = _el('div');
      item.style.cssText = `display:flex;align-items:center;gap:${gap}px;cursor:pointer`;

      const track = _el('div');
      track.style.cssText = `width:${w}px;height:${h}px;border-radius:${h}px;
        border:${borderW}px solid ${borderCol || 'transparent'};
        background:${bgCol};position:relative;transition:background 0.2s`;

      const thumb = _el('div');
      const inset = 4;
      const tSize = h - inset * 2;
      thumb.style.cssText = `width:${tSize}px;height:${tSize}px;border-radius:50%;
        background:${thumbCol};position:absolute;top:${inset - borderW}px;
        ${on ? `right:${inset - borderW}px` : `left:${inset - borderW}px`};transition:left 0.2s,right 0.2s`;
      track.appendChild(thumb);

      const label = _el('div');
      label.style.cssText = `font-weight:600;font-size:16px`;
      label.textContent = on ? 'On' : 'Off';

      item.appendChild(track);
      item.appendChild(label);
      row.appendChild(item);
    }

    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  7. INPUTS                                                        */
  /* ================================================================ */
  buildInputs(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    // textField tokens
    const h = px('input.size.textField.field.height');
    const minW = px('input.size.textField.field.mindWidth') || px('input.size.textField.field.minWidth') || 320;
    const padH = px('input.spacing.textField.field.horiztonalPadding') || px('input.spacing.textField.field.horizontalPadding') || 8;
    const padV = px('input.spacing.textField.field.verticalPadding');
    const radius = px('input.borderRadius.textField.field');
    const borderW = px('input.borderWidth.textField.field.default');
    const borderWFocus = px('input.borderWidth.textField.field.selected');

    const bgCol = v('input.colour.textField.field.background');
    const borderCol = v('input.colour.textField.field.border.default');
    const borderHover = v('input.colour.textField.field.border.hover');
    const borderFocus = v('input.colour.textField.field.border.selected');
    const borderError = v('input.colour.textField.field.border.error');
    const textCol = v('input.colour.textField.field.text.default');
    const placeholderCol = v('input.colour.textField.field.text.placeholder');
    const labelCol = v('input.colour.textField.label.default');
    const errorCol = v('input.colour.textField.label.error');

    const states = [
      { label: 'Default', border: borderCol, bw: borderW },
      { label: 'Hover', border: borderHover, bw: borderW },
      { label: 'Focus', border: borderFocus, bw: borderWFocus || 2 },
      { label: 'Error', border: borderError, bw: borderWFocus || 2 },
    ];

    // Text fields
    const row = _el('div','preview-row preview-row-wrap');
    const rowLabel = _el('div','preview-label');
    rowLabel.textContent = 'Text Field';
    row.appendChild(rowLabel);

    for (const st of states) {
      const field = _el('div','preview-field-group');

      const lbl = _el('label');
      lbl.style.cssText = `color:${st.label === 'Error' ? errorCol : labelCol};font-size:14px;font-weight:600;margin-bottom:4px;display:block`;
      lbl.textContent = `Label (${st.label})`;

      const input = _el('input');
      input.type = 'text';
      input.placeholder = 'Placeholder text';
      input.style.cssText = `
        height:${h}px;min-width:${Math.min(minW, 240)}px;width:100%;
        padding:${padV}px ${padH}px;border-radius:${radius}px;
        border:${st.bw}px solid ${st.border};background:${bgCol};
        color:${textCol};font-size:16px;font-family:inherit;outline:none;box-sizing:border-box`;

      field.appendChild(lbl);
      field.appendChild(input);
      row.appendChild(field);
    }
    wrap.appendChild(row);

    // Text area
    const areaH = px('input.size.textArea.field.height') || 96;
    const areaRow = _el('div','preview-row');
    const areaLabel = _el('div','preview-label');
    areaLabel.textContent = 'Text Area';
    areaRow.appendChild(areaLabel);

    const ta = _el('textarea');
    ta.placeholder = 'Enter longer text here...';
    ta.style.cssText = `
      height:${areaH}px;min-width:${Math.min(minW, 320)}px;width:320px;
      padding:${padV}px ${padH}px;border-radius:${radius}px;
      border:${borderW}px solid ${borderCol};background:${bgCol};
      color:${textCol};font-size:16px;font-family:inherit;outline:none;resize:vertical;box-sizing:border-box`;
    areaRow.appendChild(ta);
    wrap.appendChild(areaRow);

    return wrap;
  },

  /* ================================================================ */
  /*  8. VALIDATION LIST                                               */
  /* ================================================================ */
  buildValidationList(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const iconError = v('listtItem.colour.icon.error') || v('listItem.colour.icon.error');
    const iconSuccess = v('listtItem.colour.icon.success') || v('listItem.colour.icon.success');
    const textCol = v('listtItem.colour.text.default') || v('listItem.colour.text.default');
    const itemGap = px('listitem.spacing.gap') || px('listtItem.spacing.gap') || 4;
    const listGap = px('list.spacing.gap') || 8;

    const list = _el('div');
    list.style.cssText = `display:flex;flex-direction:column;gap:${listGap}px`;

    const items = [
      { icon: '\u2713', color: iconSuccess, text: 'At least 8 characters' },
      { icon: '\u2713', color: iconSuccess, text: 'Contains a number' },
      { icon: '\u2717', color: iconError, text: 'Contains a special character' },
    ];

    for (const it of items) {
      const row = _el('div');
      row.style.cssText = `display:flex;align-items:center;gap:${itemGap}px`;
      const icon = _el('span');
      icon.style.cssText = `color:${it.color};font-size:16px;font-weight:700`;
      icon.textContent = it.icon;
      const txt = _el('span');
      txt.style.cssText = `color:${textCol};font-size:14px`;
      txt.textContent = it.text;
      row.appendChild(icon);
      row.appendChild(txt);
      list.appendChild(row);
    }

    wrap.appendChild(list);
    return wrap;
  },

  /* ================================================================ */
  /*  9. DROPDOWN LIST                                                 */
  /* ================================================================ */
  buildDropdownList(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const itemH = px('listitem.size.height') || px('listItem.size.height') || 48;
    const minW = px('list.size.mindWidth') || px('list.size.minWidth') || 320;
    const padH = px('listItem.spacing.horiztonalPadding') || px('listItem.spacing.horizontalPadding') || 12;
    const padV = px('listItem.spacing.verticalPadding') || 8;
    const radius = px('list.borderRadius.default') || 8;
    const bgDefault = v('listitem.colour.background.default') || v('listItem.colour.background.default');
    const bgHover = v('listitem.colour.background.hover') || v('listItem.colour.background.hover');
    const bgDisabled = v('listitem.colour.background.disabled') || v('listItem.colour.background.disabled');
    const textPlaceholder = v('listItem.colour.text.placeholder.default');
    const textDisabled = v('listItem.colour.text.placeholder.disabled');

    const list = _el('div');
    list.style.cssText = `min-width:${Math.min(minW,320)}px;border-radius:${radius}px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid var(--neutral-6)`;

    const entries = [
      { text: 'Option one', state: 'default' },
      { text: 'Option two (hover)', state: 'hover' },
      { text: 'Option three', state: 'default' },
      { text: 'Disabled option', state: 'disabled' },
    ];

    for (const e of entries) {
      const item = _el('div');
      const bg = e.state === 'hover' ? bgHover : e.state === 'disabled' ? bgDisabled : bgDefault;
      const col = e.state === 'disabled' ? textDisabled : textPlaceholder;
      item.style.cssText = `height:${itemH}px;padding:${padV}px ${padH}px;background:${bg};
        color:${col};font-size:16px;font-weight:600;display:flex;align-items:center;
        cursor:${e.state === 'disabled' ? 'not-allowed' : 'pointer'};
        ${e.state === 'disabled' ? 'opacity:0.6' : ''}`;
      item.textContent = e.text;
      if (e.state !== 'disabled' && e.state !== 'hover') {
        _addHoverBg(item, bgHover, bg);
      }
      list.appendChild(item);
    }

    wrap.appendChild(list);
    return wrap;
  },

  /* ================================================================ */
  /*  10. SLIDER (atom + sliderField molecule)                         */
  /* ================================================================ */
  buildSlider(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    // ── Atom: slider track ──
    const trackH = px('slider.sizing.track.height') || 6;
    const minW = px('slider.sizing.track.mindWidth') || px('slider.sizing.track.minWidth') || 200;
    const trackBg = v('slider.colour.track.background.disabled') || v('slider.colour.track.background.default');
    const trackBorder = v('slider.colour.track.border.default');
    const indicatorBg = v('slider.colour.indicator.background.default');

    const atomLabel = _el('div','preview-label');
    atomLabel.textContent = 'Slider (atom)';
    wrap.appendChild(atomLabel);

    const atomRow = _el('div','preview-row');
    const track = _el('div');
    track.style.cssText = `width:${minW}px;height:${trackH}px;border-radius:${trackH}px;
      background:${trackBg};position:relative;border:1px solid ${trackBorder || 'transparent'}`;

    const fill = _el('div');
    fill.style.cssText = `width:60%;height:100%;border-radius:${trackH}px;background:${indicatorBg}`;
    track.appendChild(fill);

    const thumb = _el('div');
    thumb.style.cssText = `width:20px;height:20px;border-radius:50%;background:${indicatorBg};
      position:absolute;top:50%;left:60%;transform:translate(-50%,-50%);
      box-shadow:0 1px 4px rgba(0,0,0,0.15);cursor:grab`;
    track.appendChild(thumb);

    atomRow.appendChild(track);
    wrap.appendChild(atomRow);

    // ── Molecule: sliderField (labels + slider + description) ──
    const fieldGap = px('sliderField.spacing.gap') || 12;
    const labelGap = px('sliderField.spacing.label.gap') || 8;
    const labelColour = v('sliderField.colour.text.label');
    const descColour = v('sliderField.colour.text.description');
    const labelTypo = this._typo(data, 'sliderField.typography.label', parser);
    const descTypo = this._typo(data, 'sliderField.typography.description', parser);

    if (labelColour || descColour || labelTypo || descTypo) {
      const molLabel = _el('div','preview-label');
      molLabel.textContent = 'Slider Field (molecule)';
      molLabel.style.marginTop = '16px';
      wrap.appendChild(molLabel);

      const field = _el('div');
      field.style.cssText = `display:flex;flex-direction:column;gap:${fieldGap}px;align-items:center;width:100%;max-width:375px`;

      // Row: leading label + track + trailing label
      const row = _el('div');
      row.style.cssText = `display:flex;align-items:center;gap:${fieldGap}px;width:100%`;

      // Leading label
      const leading = _el('div');
      leading.style.cssText = `display:flex;align-items:center;gap:${labelGap}px;flex-shrink:0`;
      const leadIcon = _el('div');
      leadIcon.style.cssText = `width:24px;height:24px;border-radius:4px;background:#ddd;flex-shrink:0`;
      leading.appendChild(leadIcon);
      const leadText = _el('span');
      leadText.textContent = 'Label';
      leadText.style.cssText = `${labelTypo};color:${labelColour || 'inherit'};white-space:nowrap`;
      leading.appendChild(leadText);
      row.appendChild(leading);

      // Track (reuse atom styling)
      const track2 = _el('div');
      track2.style.cssText = `flex:1;min-width:120px;height:${trackH}px;border-radius:${trackH}px;
        background:${trackBg};position:relative;border:1px solid ${trackBorder || 'transparent'}`;
      const fill2 = _el('div');
      fill2.style.cssText = `width:50%;height:100%;border-radius:${trackH}px;background:${indicatorBg}`;
      track2.appendChild(fill2);
      const thumb2 = _el('div');
      thumb2.style.cssText = `width:20px;height:20px;border-radius:50%;background:${indicatorBg};
        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        box-shadow:0 1px 4px rgba(0,0,0,0.15)`;
      track2.appendChild(thumb2);
      row.appendChild(track2);

      // Trailing label
      const trailing = _el('div');
      trailing.style.cssText = `display:flex;align-items:center;gap:${labelGap}px;flex-shrink:0`;
      const trailText = _el('span');
      trailText.textContent = 'Label';
      trailText.style.cssText = `${labelTypo};color:${labelColour || 'inherit'};white-space:nowrap`;
      trailing.appendChild(trailText);
      const trailIcon = _el('div');
      trailIcon.style.cssText = `width:24px;height:24px;border-radius:4px;background:#ddd;flex-shrink:0`;
      trailing.appendChild(trailIcon);
      row.appendChild(trailing);

      field.appendChild(row);

      // Description
      const desc = _el('div');
      desc.textContent = 'Description';
      desc.style.cssText = `${descTypo};color:${descColour || 'inherit'};text-align:center`;
      field.appendChild(desc);

      wrap.appendChild(field);
    }

    return wrap;
  },

  /* ================================================================ */
  /*  11. GRABBER                                                      */
  /* ================================================================ */
  buildGrabber(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const w = px('grabber.size.bar.width') || 64;
    const h = px('grabber.size.bar.height') || 2;
    const bg = v('grabber.colour.background.default');

    const row = _el('div','preview-row');
    row.style.justifyContent = 'center';
    const container = _el('div');
    container.style.cssText = `padding:16px 32px;background:var(--neutral-3);border-radius:8px;display:flex;flex-direction:column;align-items:center;gap:4px`;

    for (let i = 0; i < 2; i++) {
      const bar = _el('div');
      bar.style.cssText = `width:${w}px;height:${h}px;background:${bg};border-radius:1px`;
      container.appendChild(bar);
    }

    row.appendChild(container);
    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  12. BREADCRUMBS                                                  */
  /* ================================================================ */
  buildBreadcrumbs(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const h = px('breadcrumbs.size.link.height') || 24;
    const gap = px('breadcrumbs.spacing.gap') || 8;
    const textCol = v('breadcrumbs.colour.link.text.default');
    const linkTypo = this._typo(data, 'breadcrumbs.typography.link', parser);
    const currentTypo = this._typo(data, 'breadcrumbs.typography.currentPage', parser);

    const row = _el('div','preview-row');
    const nav = _el('nav');
    nav.style.cssText = `display:flex;align-items:center;gap:${gap}px`;

    const crumbs = ['Home', 'Products', 'Dog Food', 'Chicken'];
    crumbs.forEach((text, i) => {
      if (i > 0) {
        const sep = _el('span');
        sep.style.cssText = `color:${textCol};font-size:14px`;
        sep.textContent = '/';
        nav.appendChild(sep);
      }
      const link = _el('a');
      const isCurrent = i === crumbs.length - 1;
      link.style.cssText = `color:${textCol};height:${h}px;display:inline-flex;align-items:center;
        text-decoration:none;cursor:pointer;${isCurrent ? currentTypo : linkTypo}`;
      link.textContent = text;
      link.href = '#';
      link.onclick = (e) => e.preventDefault();
      nav.appendChild(link);
    });

    row.appendChild(nav);
    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  13. SPINNER                                                      */
  /* ================================================================ */
  buildSpinner(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const sizes = { sm: px('spinner.size.sm'), md: px('spinner.size.md'), lg: px('spinner.size.lg') };
    const baseLightCol = v('spinner.colour.background.base.light');
    const progressLightCol = v('spinner.colour.background.progress.light');
    const baseDarkCol = v('spinner.colour.background.base.dark');
    const progressDarkCol = v('spinner.colour.background.progress.dark');

    // Light theme
    const row = _el('div','preview-row');
    row.style.gap = '24px';

    for (const [name, size] of Object.entries(sizes)) {
      if (!size) continue;
      const item = _el('div','preview-spinner-item');
      const spinner = _el('div','preview-spinner');
      spinner.style.cssText = `width:${size}px;height:${size}px;
        border:3px solid ${baseLightCol || '#eee'};
        border-top-color:${progressLightCol || '#80254A'};
        border-radius:50%;animation:spin 0.8s linear infinite`;
      const lbl = _el('div','preview-icon-label');
      lbl.textContent = `${name} (${size}px)`;
      item.appendChild(spinner);
      item.appendChild(lbl);
      row.appendChild(item);
    }

    // Dark theme
    const darkItem = _el('div');
    darkItem.style.cssText = 'background:#522A10;padding:16px;border-radius:8px;display:flex;gap:16px;align-items:center';
    for (const [name, size] of Object.entries(sizes)) {
      if (!size) continue;
      const spinner = _el('div','preview-spinner');
      spinner.style.cssText = `width:${size}px;height:${size}px;
        border:3px solid ${baseDarkCol || 'rgba(255,255,255,0.2)'};
        border-top-color:${progressDarkCol || '#fff'};
        border-radius:50%;animation:spin 0.8s linear infinite`;
      darkItem.appendChild(spinner);
    }
    const darkLabel = _el('span');
    darkLabel.style.cssText = 'color:#fff;font-size:12px';
    darkLabel.textContent = 'Dark variant';
    darkItem.appendChild(darkLabel);
    row.appendChild(darkItem);

    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  14. SEGMENTED CONTROL                                            */
  /* ================================================================ */
  buildSegmentedControl(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const itemH = px('controlItem.size.small.height') || 36;
    const minW = px('controlItem.size.small.mindWidth') || px('controlItem.size.small.minWidth') || 88;
    const padH = px('controlItem.spacing.horizontalPadding') || px('controlItem.spacing.horiztonalPadding') || 16;
    const padV = px('controlItem.spacing.verticalPadding') || 12;
    const itemRadius = px('controlItem.borderRadius.default');
    const controlBg = v('segmentedControl.colour.default');
    const controlRadius = px('segmentedControl.borderRadius.default');
    const controlPad = px('segmentedControl.spacing.padding') || 4;
    const controlGap = px('segmentedControl.spacing.gap') || 4;
    const selectedBg = v('controlItem.colour.background.selected');
    const hoverBg = v('controlItem.colour.background.hover');
    const selectedText = v('controlItem.colour.text.selected');
    const unselectedText = v('controlItem.colour.text.unselected');
    const typoDefault = this._typo(data, 'controlItem.typography.label.default', parser);
    const typoInactive = this._typo(data, 'controlItem.typography.label.inactive', parser);

    const row = _el('div','preview-row');
    const control = _el('div');
    control.style.cssText = `display:inline-flex;gap:${controlGap}px;padding:${controlPad}px;
      background:${controlBg};border-radius:${controlRadius}px`;

    const tabs = ['Weekly', 'Fortnightly', 'Monthly'];
    tabs.forEach((text, i) => {
      const selected = i === 0;
      const btn = _el('button');
      btn.style.cssText = `height:${itemH}px;min-width:${minW}px;padding:0 ${padH}px;
        border-radius:${itemRadius}px;border:none;cursor:pointer;
        background:${selected ? selectedBg : 'transparent'};
        color:${selected ? selectedText : unselectedText};
        ${selected ? typoDefault : typoInactive}`;
      btn.textContent = text;
      control.appendChild(btn);
    });

    row.appendChild(control);
    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  15. PRIMARY TAB                                                  */
  /* ================================================================ */
  buildPrimaryTab(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const itemH = px('primaryTab.tabitem.size.height') || px('primaryTab.tabItem.size.height') || 96;
    const minW = px('primaryTab.tabitem.size.mindWidth') || px('primaryTab.tabItem.size.minWidth') || px('primaryTab.tabItem.size.mindWidth') || 76;
    const padH = px('primaryTab.tabItem.spacing.horiztonalPadding') || px('primaryTab.tabItem.spacing.horizontalPadding') || 12;
    const borderW = px('primaryTab.tabItem.borderWidth.default') || 3;
    const borderCol = v('primaryTab.tabItem.colour.border.default');
    const borderHover = v('primaryTab.tabItem.colour.border.hover');
    const borderDisabled = v('primaryTab.tabItem.colour.border.disabled');
    const textCol = v('primaryTab.tabItem.colour.text.default');
    const typoDefault = this._typo(data, 'primaryTab.tabItem.typography.default', parser);
    const typoDisabled = this._typo(data, 'primaryTab.tabItem.typography.disabled', parser);

    const row = _el('div','preview-row');
    row.style.borderBottom = `1px solid var(--neutral-6)`;

    const tabs = [
      { text: 'Active', active: true },
      { text: 'Default', active: false },
      { text: 'Disabled', disabled: true },
    ];

    for (const tab of tabs) {
      const btn = _el('button');
      const bCol = tab.active ? borderCol : tab.disabled ? borderDisabled : 'transparent';
      btn.style.cssText = `height:${itemH}px;min-width:${minW}px;padding:0 ${padH}px;
        border:none;border-bottom:${borderW}px solid ${bCol};
        background:transparent;cursor:pointer;color:${textCol};
        ${tab.disabled ? typoDisabled : typoDefault};
        ${tab.disabled ? 'opacity:0.5' : ''}`;
      btn.textContent = tab.text;
      if (!tab.active && !tab.disabled) {
        btn.onmouseenter = () => btn.style.borderBottomColor = borderHover;
        btn.onmouseleave = () => btn.style.borderBottomColor = 'transparent';
      }
      row.appendChild(btn);
    }

    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  16. CAROUSEL CONTROLS                                            */
  /* ================================================================ */
  buildCarouselControls(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const containerBg = v('carouselControl.colour.background.default') || v('controls.colour.background.default');
    const activeCol = v('carouselControl.colour.slot.active') || v('controls.colour.slot.active');
    const disabledCol = v('carouselControl.colour.slot.disabled') || v('controls.colour.slot.disabled');
    const dotDefault = px('carouselControl.sizing.slot.default') || px('controls.sizing.slot.default') || 8;
    const dotSmall = px('carouselControl.sizing.slot.inactiveSmall') || px('controls.sizing.slot.inactiveSmall') || 4;
    const dotMed = px('carouselControl.sizing.slot.inactiveMedium') || px('controls.sizing.slot.inactiveMedium') || 6;
    const radius = px('carouselControl.borderRadius.default') || px('controls.borderRadius.default');

    const row = _el('div','preview-row');
    row.style.justifyContent = 'center';
    const nav = _el('div');
    nav.style.cssText = `display:flex;gap:6px;align-items:center;padding:8px 16px;background:${containerBg};border-radius:${radius}px`;

    const dots = [dotSmall, dotMed, dotDefault, dotDefault, dotMed, dotSmall];
    const activeIdx = 2;

    dots.forEach((size, i) => {
      const dot = _el('div');
      const isActive = i === activeIdx;
      dot.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;
        background:${isActive ? activeCol : disabledCol};transition:all 0.2s`;
      nav.appendChild(dot);
    });

    row.appendChild(nav);
    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  17. BADGES                                                       */
  /* ================================================================ */
  buildBadges(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const variants = ['default','promo','success','warning','error'];

    for (const size of ['large','medium','small']) {
      const row = _el('div','preview-row');
      const label = _el('div','preview-label');
      label.textContent = size;
      row.appendChild(label);

      const h = px(`badge.sizing.${size}.height`) || px(`badge.sizing.${size}`);
      const padH = px(`badge.spacing.${size}.horizontalPadding`) || 8;
      const radius = px('badge.primary.borderRadius.default') || 4;

      for (const variant of variants) {
        const bg = v(`badge.colour.background.${variant}`);
        const textCol = v(`badge.colour.text.${variant}`) || v('badge.colour.text.default');
        if (!bg) continue;

        const badge = _el('span');
        badge.style.cssText = `height:${h}px;padding:0 ${padH}px;border-radius:${radius}px;
          background:${bg};color:${textCol};display:inline-flex;align-items:center;
          font-size:12px;font-weight:700`;
        badge.textContent = variant;
        row.appendChild(badge);
      }
      wrap.appendChild(row);
    }
    return wrap;
  },

  /* ================================================================ */
  /*  18. TAGS                                                         */
  /* ================================================================ */
  buildTags(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const variants = ['default','promo','success','warning','error'];
    const radius = px('badge.borderRadius.default') || px('tags.borderRadius.default');

    for (const size of ['large','medium','small']) {
      const row = _el('div','preview-row');
      const label = _el('div','preview-label');
      label.textContent = size;
      row.appendChild(label);

      const h = px(`tags.sizing.${size}.height`) || px(`tags.sizing.${size}`);
      const padH = px(`tags.spacing.${size}.horizontalPadding`) || px(`tags.spacing.horizontalPadding`) || 8;

      for (const variant of variants) {
        const bg = v(`tags.colour.primary.background.${variant}`) || v(`tags.colour.primary.${variant}`);
        const textCol = v(`tags.colour.text.${variant}`) || v('tags.colour.text.default');
        if (!bg) continue;

        const tag = _el('span');
        tag.style.cssText = `height:${h}px;padding:0 ${padH}px;border-radius:${radius || 100}px;
          background:${bg};color:${textCol};display:inline-flex;align-items:center;
          font-size:13px;font-weight:600`;
        tag.textContent = variant;
        row.appendChild(tag);
      }
      wrap.appendChild(row);
    }
    return wrap;
  },

  /* ================================================================ */
  /*  19. AVATAR                                                       */
  /* ================================================================ */
  buildAvatar(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const borderCol = v('avatar.colour.border.default');

    const row = _el('div','preview-row');
    row.style.gap = '24px';

    for (const size of ['small','medium','large']) {
      const s = px(`avatar.size.${size}`);
      const bw = px(`avatar.borderWidth.${size}`) || 2;
      const avatar = _el('div');
      avatar.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;
        border:${bw}px solid ${borderCol};background:var(--yellow-3);
        display:flex;align-items:center;justify-content:center;
        font-size:${s * 0.4}px;font-weight:700;color:var(--brown-9)`;
      avatar.textContent = 'JP';
      const lbl = _el('div','preview-icon-label');
      lbl.textContent = `${size} (${s}px)`;
      const item = _el('div','preview-icon-item');
      item.appendChild(avatar);
      item.appendChild(lbl);
      row.appendChild(item);
    }

    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  20. STAR RATING                                                  */
  /* ================================================================ */
  buildStarRating(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const size = px('starRating.sizing.default') || px('starItem.sizing.default') || 24;
    const gap = px('starRating.spacing.gap') || px('starItem.spacing.gap') || 8;
    const iconCol = v('starRating.colour.icon.default') || v('starItem.colour.icon.default');
    const textCol = v('starRating.colour.text.default') || v('starItem.colour.text.default');

    const row = _el('div','preview-row');
    row.style.gap = `${gap}px`;

    const rating = 3.5;
    for (let i = 1; i <= 5; i++) {
      const star = _el('span');
      star.style.cssText = `font-size:${size}px;color:${i <= Math.floor(rating) ? iconCol : 'var(--neutral-6)'};cursor:pointer`;
      star.textContent = '\u2605';
      row.appendChild(star);
    }
    const text = _el('span');
    text.style.cssText = `color:${textCol};font-size:14px;align-self:center`;
    text.textContent = '3.5 / 5';
    row.appendChild(text);

    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  21. STEP                                                         */
  /* ================================================================ */
  buildStep(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const statusSize = px('step.stepStatus.size.default') || px('stepItem.stepStatus.size.default') || 32;
    const activeBg = v('step.stepStatus.colour.background.active') || v('stepItem.stepStatus.colour.background.active');
    const disabledBg = v('step.stepStatus.colour.background.disabled') || v('stepItem.stepStatus.colour.background.disabled');
    const activeText = v('step.stepStatus.colour.text.active') || v('stepItem.stepStatus.colour.text.active');
    const disabledText = v('step.stepStatus.colour.text.disabled') || v('stepItem.stepStatus.colour.text.disabled');
    const trackH = px('step.stepTrack.track.size.ronded.height') || px('step.stepTrack.track.size.rounded.height') || 6;
    const trackMinW = px('step.stepTrack.track.size.ronded.mindWidth') || px('step.stepTrack.track.size.rounded.minWidth') || 100;
    const trackBg = v('step.stepTrack.track.colour.background');
    const indicatorBg = v('step.stepTrack.indicator.colour.background');
    const labelCol = v('step.label.text.default');
    const gap = px('step.linked.spacing.gap') || 8;

    const row = _el('div','preview-row');
    row.style.gap = `${gap}px`;
    row.style.alignItems = 'center';

    const steps = ['Account', 'Address', 'Payment', 'Confirm'];
    steps.forEach((text, i) => {
      const isActive = i <= 1;
      const isCurrent = i === 1;

      // Status circle
      const circle = _el('div');
      circle.style.cssText = `width:${statusSize}px;height:${statusSize}px;border-radius:50%;
        background:${isActive ? activeBg : disabledBg};
        color:${isActive ? activeText : disabledText};
        display:flex;align-items:center;justify-content:center;
        font-size:14px;font-weight:700;flex-shrink:0`;
      circle.textContent = i < 1 ? '\u2713' : String(i + 1);
      row.appendChild(circle);

      // Label
      const lbl = _el('span');
      lbl.style.cssText = `color:${labelCol};font-size:14px;font-weight:${isCurrent ? 700 : 400}`;
      lbl.textContent = text;
      row.appendChild(lbl);

      // Track
      if (i < steps.length - 1) {
        const track = _el('div');
        track.style.cssText = `width:${trackMinW}px;height:${trackH}px;border-radius:${trackH}px;
          background:${trackBg};position:relative;overflow:hidden`;
        if (isActive && !isCurrent) {
          const fill = _el('div');
          fill.style.cssText = `width:100%;height:100%;background:${indicatorBg};border-radius:${trackH}px`;
          track.appendChild(fill);
        } else if (isCurrent) {
          const fill = _el('div');
          fill.style.cssText = `width:50%;height:100%;background:${indicatorBg};border-radius:${trackH}px`;
          track.appendChild(fill);
        }
        row.appendChild(track);
      }
    });

    wrap.appendChild(row);
    return wrap;
  },

  /* ================================================================ */
  /*  22. PROGRESS                                                     */
  /* ================================================================ */
  buildProgress(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const trackH = px('progress.track.size.large.height') || px('progressBar.track.size.large.height') || 8;
    const minW = px('progress.track.size.large.mindWidth') || px('progress.track.size.large.minWidth') || px('progressBar.track.size.large.mindWidth') || 200;
    const trackBg = v('progress.track.colour.background.default') || v('progressBar.track.colour.background.default');
    const indicatorBg = v('progress.indicator.colour.background.primary') || v('progressBar.indicator.colour.background.primary');
    const indicatorBg2 = v('progress.indicator.colour.background.secondary') || v('progressBar.indicator.colour.background.secondary');
    const textCol = v('progress.colour.text.label') || v('progressBar.colour.text.label');
    const gap = px('progress.spacing.gap') || px('progressBar.spacing.gap') || 12;

    for (const [variant, bg, pct] of [['Primary', indicatorBg, 65], ['Secondary', indicatorBg2, 40]]) {
      const row = _el('div','preview-row');
      row.style.cssText = `flex-direction:column;gap:${gap}px;align-items:flex-start`;

      const labelRow = _el('div');
      labelRow.style.cssText = `display:flex;justify-content:space-between;width:${minW}px`;
      const lbl = _el('span');
      lbl.style.cssText = `color:${textCol};font-size:14px;font-weight:600`;
      lbl.textContent = `${variant} — ${pct}%`;
      labelRow.appendChild(lbl);

      const track = _el('div');
      track.style.cssText = `width:${minW}px;height:${trackH}px;border-radius:${trackH}px;
        background:${trackBg};overflow:hidden`;
      const fill = _el('div');
      fill.style.cssText = `width:${pct}%;height:100%;border-radius:${trackH}px;background:${bg};transition:width 0.3s`;
      track.appendChild(fill);

      row.appendChild(labelRow);
      row.appendChild(track);
      wrap.appendChild(row);
    }
    return wrap;
  },

  /* ================================================================ */
  /*  23. DATE PICKER                                                  */
  /* ================================================================ */
  buildDatePicker(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    const monthGap = px('month.spacing.gap') || 32;
    const monthTextCol = v('month.colour.text.default');
    const monthTypo = this._typo(data, 'month.typography', parser);
    const weekTextCol = v('week.colour.text.default');
    const weekTypo = this._typo(data, 'week.typography', parser);
    const dateH = px('dateItem.size.height') || 64;
    const dateW = px('dateItem.size.width') || 88;
    const indicatorSize = px('dateItem.size.indicator') || 56;
    const indicatorRadius = px('dateItem.indicator.borderRadius.default');
    const dateTextCol = v('dateItem.colour.text.default');
    const prevTextCol = v('dateItem.colour.text.previous');
    const hoverBg = v('dateItem.indicator.colour.background.hover');
    const selectedBorder = v('dateItem.colour.border.nextBoxSelected') || v('dateItem.colour.border.futureBoxSelected');
    const selectedBW = px('dateItem.borderWidth.indicator.selected') || 2;
    const dateTypo = this._typo(data, 'dateItem.typography.default', parser);
    const currentTypo = this._typo(data, 'dateItem.typography.currentDate', parser);
    const datesGap = px('dates.spacing.gap') || 4;
    const pickerGap = px('datePicker.spacing.gap') || 32;
    const disabledOpacity = parseFloat(v('dateItem.opacity.disabled') || '0.35');

    const picker = _el('div');
    picker.style.cssText = `display:flex;flex-direction:column;gap:${pickerGap}px`;

    // Month header
    const monthRow = _el('div');
    monthRow.style.cssText = `display:flex;align-items:center;gap:${monthGap}px;justify-content:center`;
    const monthLabel = _el('span');
    monthLabel.style.cssText = `color:${monthTextCol};${monthTypo}`;
    monthLabel.textContent = 'February 2026';
    const prevBtn = _el('button');
    prevBtn.style.cssText = 'border:none;background:none;cursor:pointer;font-size:18px';
    prevBtn.textContent = '\u2190';
    const nextBtn = _el('button');
    nextBtn.style.cssText = 'border:none;background:none;cursor:pointer;font-size:18px';
    nextBtn.textContent = '\u2192';
    monthRow.appendChild(prevBtn);
    monthRow.appendChild(monthLabel);
    monthRow.appendChild(nextBtn);
    picker.appendChild(monthRow);

    // Week header
    const weekRow = _el('div');
    weekRow.style.cssText = `display:grid;grid-template-columns:repeat(7,${dateW}px);gap:${datesGap}px`;
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    for (const d of days) {
      const cell = _el('div');
      cell.style.cssText = `text-align:center;color:${weekTextCol};${weekTypo}`;
      cell.textContent = d;
      weekRow.appendChild(cell);
    }
    picker.appendChild(weekRow);

    // Date grid — simulate Feb 2026 (starts on Sunday)
    const grid = _el('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(7,${dateW}px);gap:${datesGap}px`;

    // Previous month padding (Feb 2026 starts Sun, so 6 days of prev month)
    for (let i = 26; i <= 31; i++) {
      const cell = _makeDate(i, prevTextCol, disabledOpacity, dateH, dateW, indicatorSize, indicatorRadius, dateTypo, null, null, 0, true);
      grid.appendChild(cell);
    }

    // This month dates
    const today = 9;
    const selected = 14;
    for (let i = 1; i <= 28; i++) {
      const isToday = i === today;
      const isSelected = i === selected;
      const isPast = i < today;
      const cell = _makeDate(
        i,
        isPast ? prevTextCol : dateTextCol,
        isPast ? disabledOpacity : 1,
        dateH, dateW, indicatorSize, indicatorRadius,
        isToday ? currentTypo : dateTypo,
        isSelected ? selectedBorder : null,
        isSelected ? selectedBW : 0,
        hoverBg,
        false
      );
      grid.appendChild(cell);
    }

    picker.appendChild(grid);
    wrap.appendChild(picker);
    return wrap;
  },

  /* ================================================================ */
  /*  24. FILTER TABS                                                  */
  /* ================================================================ */
  buildFilterTabs(data, parser) {
    const wrap = _el('div','preview-wrap');
    const v = (p) => this._val(data, p, parser);
    const px = (p) => this._px(v(p));

    for (const size of ['large','small']) {
      const row = _el('div','preview-row');
      const label = _el('div','preview-label');
      label.textContent = size;
      row.appendChild(label);

      const h = px(`tabItem.size.${size}.height`) || (size === 'large' ? 44 : 36);
      const minW = px(`tabItem.size.${size}.mindWidth`) || px(`tabItem.size.${size}.minWidth`) || 88;
      const padH = px('tabItem.spacing.horizontalPadding') || px('tabItem.spacing.horiztonalPadding') || 16;
      const radius = px('tabItem.borderRadius.default');
      const gap = px('filterTab.spacing.gap') || px('tabiItem.spacing.gap') || 8;
      const bgDefault = v('tabItem.colour.background.default');
      const bgSelected = v('tabItem.colour.background.selected');
      const bgHover = v('tabItem.colour.background.hover');
      const textDefault = v('tabItem.colour.text.default');
      const textSelected = v('tabItem.colour.text.selected');
      const textInactive = v('tabItem.colour.text.inactive');
      const opacity = parseFloat(v('tabiItem.opacity.disabled') || '0.5');
      const typoDefault = this._typo(data, 'tabItem.typography.label.default', parser);
      const typoInactive = this._typo(data, 'tabItem.typography.label.inactive', parser);

      const tabRow = _el('div');
      tabRow.style.cssText = `display:flex;gap:${gap}px`;

      const tabs = [
        { text: 'All', selected: true },
        { text: 'Popular', selected: false },
        { text: 'New', selected: false },
        { text: 'Disabled', disabled: true },
      ];

      for (const tab of tabs) {
        const btn = _el('button');
        const bg = tab.selected ? bgSelected : bgDefault;
        const txt = tab.selected ? textSelected : tab.disabled ? textInactive : textDefault;
        btn.style.cssText = `height:${h}px;min-width:${minW}px;padding:0 ${padH}px;
          border-radius:${radius}px;border:none;cursor:pointer;
          background:${bg};color:${txt};
          ${tab.selected ? typoDefault : typoInactive};
          ${tab.disabled ? `opacity:${opacity};pointer-events:none` : ''}`;
        btn.textContent = tab.text;
        if (!tab.selected && !tab.disabled) {
          _addHoverBg(btn, bgHover, bg);
        }
        tabRow.appendChild(btn);
      }

      row.appendChild(tabRow);
      wrap.appendChild(row);
    }
    return wrap;
  },
};

/* ==================================================================== */
/*  Shared helpers                                                       */
/* ==================================================================== */

function _el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function _addHover(btn, hoverBg, defaultBg, keepBg) {
  btn.addEventListener('mouseenter', () => { btn.style.background = hoverBg; });
  btn.addEventListener('mouseleave', () => { btn.style.background = keepBg ? defaultBg : defaultBg; });
}

function _addHoverBg(el, hoverBg, defaultBg) {
  el.addEventListener('mouseenter', () => { el.style.background = hoverBg; });
  el.addEventListener('mouseleave', () => { el.style.background = defaultBg; });
}

function _makeDate(day, textCol, opacity, h, w, indicator, radius, typo, borderCol, borderW, hoverBg, isPrev) {
  const cell = _el('div');
  cell.style.cssText = `width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center;
    ${opacity < 1 ? `opacity:${opacity}` : ''}`;

  const inner = _el('div');
  inner.style.cssText = `width:${indicator}px;height:${indicator}px;border-radius:${radius || 100}px;
    display:flex;align-items:center;justify-content:center;
    color:${textCol};${typo};cursor:${isPrev ? 'default' : 'pointer'};
    ${borderCol ? `border:${borderW}px solid ${borderCol}` : ''}`;
  inner.textContent = day;

  if (!isPrev && hoverBg) {
    inner.addEventListener('mouseenter', () => { if (!borderCol) inner.style.background = hoverBg; });
    inner.addEventListener('mouseleave', () => { if (!borderCol) inner.style.background = 'transparent'; });
  }

  cell.appendChild(inner);
  return cell;
}

/* ================================================================ */
/*  25. BUTTON DOCK                                                    */
/* ================================================================ */
Previews.buildButtonDock = function(data, parser) {
  const wrap = _el('div','preview-wrap');
  const v = (p) => this._val(data, p, parser);
  const px = (p) => this._px(v(p));

  const dockBg = v('buttonDock.colour.background');
  const dockBorder = v('buttonDock.colour.border');
  const dockGap = px('buttonDock.spacing.gap');
  const dockPad = px('buttonDock.spacing.padding.default');
  const listGap = px('list.spacing.gap');
  const headerCol = v('list.colour.text.header');
  const defaultCol = v('list.colour.text.default');
  const footerCol = v('list.colour.text.footer');
  const headerTypo = this._typo(data, 'list.typography.header', parser);
  const defaultTypo = this._typo(data, 'list.typography.default', parser);
  const footerTypo = this._typo(data, 'list.typography.footer', parser);

  const row = _el('div','preview-row');

  // Dock container
  const dock = _el('div');
  dock.style.cssText = `background:${dockBg};border:1px solid ${dockBorder};
    border-radius:12px;padding:${dockPad}px;display:flex;flex-direction:column;
    gap:${dockGap}px;min-width:320px;max-width:400px`;

  // Header
  const header = _el('div');
  header.style.cssText = `color:${headerCol};${headerTypo}`;
  header.textContent = 'Complete your order';
  dock.appendChild(header);

  // List items
  const list = _el('div');
  list.style.cssText = `display:flex;flex-direction:column;gap:${listGap}px`;
  const items = ['Fresh chicken recipe x2', 'Beef & vegetables x1', 'Turkey delight x1'];
  for (const item of items) {
    const li = _el('div');
    li.style.cssText = `color:${defaultCol};${defaultTypo}`;
    li.textContent = item;
    list.appendChild(li);
  }
  dock.appendChild(list);

  // Footer
  const footer = _el('div');
  footer.style.cssText = `color:${footerCol};${footerTypo}`;
  footer.textContent = 'Total: £42.50/week';
  dock.appendChild(footer);

  // Placeholder buttons
  const btnRow = _el('div');
  btnRow.style.cssText = `display:flex;gap:${dockGap}px`;
  for (const label of ['Continue', 'Back']) {
    const btn = _el('button');
    btn.style.cssText = `flex:1;padding:12px 20px;border-radius:100px;border:none;cursor:pointer;
      font-weight:700;font-size:16px;font-family:inherit;
      ${label === 'Continue' ? 'background:#80254A;color:#fff' : 'background:transparent;border:2px solid #80254A;color:#80254A'}`;
    btn.textContent = label;
    btnRow.appendChild(btn);
  }
  dock.appendChild(btnRow);

  row.appendChild(dock);
  wrap.appendChild(row);
  return wrap;
};

/* ================================================================ */
/*  26. DIVIDERS                                                       */
/* ================================================================ */
Previews.buildDividers = function(data, parser) {
  const wrap = _el('div','preview-wrap');
  const v = (p) => this._val(data, p, parser);
  const px = (p) => this._px(v(p));

  const lightCol = v('dividers.colour.light');
  const darkCol = v('dividers.colour.dark');

  const sizes = ['small','medium','large'];

  for (const variant of ['light','dark']) {
    const row = _el('div','preview-row');
    row.style.cssText = `flex-direction:column;gap:16px;align-items:stretch;
      ${variant === 'dark' ? 'background:#522A10;padding:20px;border-radius:8px' : ''}`;

    const label = _el('div','preview-label');
    label.style.cssText += variant === 'dark' ? ';color:#E5DFDA' : '';
    label.textContent = `${variant} divider`;
    row.appendChild(label);

    for (const size of sizes) {
      const thickness = px(`dividers.size.${size}`);
      const col = variant === 'light' ? lightCol : darkCol;

      const item = _el('div');
      item.style.cssText = `display:flex;flex-direction:column;gap:4px`;

      const hr = _el('div');
      hr.style.cssText = `width:100%;height:${thickness}px;background:${col};border-radius:1px`;
      const lbl = _el('span');
      lbl.style.cssText = `font-family:'IBM Plex Mono',monospace;font-size:11px;
        color:${variant === 'dark' ? '#BCBBB5' : '#63635E'}`;
      lbl.textContent = `${size} (${thickness}px)`;

      item.appendChild(hr);
      item.appendChild(lbl);
      row.appendChild(item);
    }
    wrap.appendChild(row);
  }
  return wrap;
};

/* ================================================================ */
/*  27. PICTURE SELECTOR                                               */
/* ================================================================ */
Previews.buildPictureSelector = function(data, parser) {
  const wrap = _el('div','preview-wrap');
  const v = (p) => this._val(data, p, parser);
  const px = (p) => this._px(v(p));

  const btnPad = px('pictureButton.spacing.padding');
  const bgDefault = v('pictureButton.colour.background.default');
  const bgActive = v('pictureButton.colour.background.active');
  const borderDefault = v('pictureButton.colour.border.default');
  const borderHover = v('pictureButton.colour.border.hover');
  const borderActive = v('pictureButton.colour.border.active');
  const pointerCol = v('pictureButton.colour.pointer');
  const radius = px('pictureButton.borderRadius.default');
  const bwDefault = px('pictureButton.borderWidth.default');
  const bwHover = px('pictureButton.borderWidth.hover');
  const bwActive = px('pictureButton.borderWidth.active');
  const selectorGap = px('pictureSelector.spacing.gap');
  const containerGap = px('pictureSelector.spacing.container.gap');
  const buttonsGap = px('pictureSelector.spacing.buttons.gap');
  const labelCol = v('pictureSelector.colour.label');
  const labelTypo = this._typo(data, 'pictureSelector.typography.label', parser);

  // Label
  const labelRow = _el('div','preview-row');
  const label = _el('div');
  label.style.cssText = `color:${labelCol};${labelTypo}`;
  label.textContent = 'Choose your recipe image';
  labelRow.appendChild(label);
  wrap.appendChild(labelRow);

  // Picture buttons
  const row = _el('div','preview-row');
  row.style.gap = `${buttonsGap}px`;

  const states = [
    { label: 'Default', bg: bgDefault, border: borderDefault, bw: bwDefault },
    { label: 'Hover', bg: bgDefault, border: borderHover, bw: bwHover },
    { label: 'Active', bg: bgActive, border: borderActive, bw: bwActive, active: true },
  ];

  for (const st of states) {
    const btn = _el('div');
    btn.style.cssText = `width:96px;height:96px;padding:${btnPad}px;border-radius:${radius}px;
      border:${st.bw}px solid ${st.border};background:${st.bg};
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      cursor:pointer;position:relative`;

    // Placeholder image area
    const img = _el('div');
    img.style.cssText = 'width:48px;height:48px;border-radius:6px;background:var(--neutral-3);margin-bottom:4px';
    btn.appendChild(img);

    const text = _el('div');
    text.style.cssText = 'font-size:11px;color:var(--neutral-11);text-align:center';
    text.textContent = st.label;
    btn.appendChild(text);

    // Pointer dot for active state
    if (st.active) {
      const pointer = _el('div');
      pointer.style.cssText = `width:8px;height:8px;border-radius:50%;background:${pointerCol};
        position:absolute;bottom:-12px;left:50%;transform:translateX(-50%)`;
      btn.appendChild(pointer);
    }

    if (!st.active) {
      btn.addEventListener('mouseenter', () => {
        btn.style.borderColor = borderHover;
        btn.style.borderWidth = bwHover + 'px';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.borderColor = st.border;
        btn.style.borderWidth = st.bw + 'px';
      });
    }

    row.appendChild(btn);
  }

  wrap.appendChild(row);
  return wrap;
};

/* ================================================================ */
/*  28. BUTTON GROUP                                                  */
/* ================================================================ */
Previews.buildButtonGroup = function(data, parser) {
  const wrap = _el('div','preview-wrap');
  const v = (p) => Previews._val(data, p, parser);
  const px = (p) => Previews._px(v(p));

  const mainGap = px('buttonGroup.spacing.gap') || 16;
  const stackedGap = px('buttonGroup.spacing.stacked.gap') || 12;
  const sideGap = px('buttonGroup.spacing.sideBySide.gap') || 8;
  const textCol = v('buttonGroup.colour.text');
  const descTypo = Previews._typo(data, 'buttonGroup.typography.description', parser);

  // Stacked layout
  const stackLabel = _el('div','preview-label');
  stackLabel.textContent = 'Stacked layout';
  wrap.appendChild(stackLabel);

  const stacked = _el('div');
  stacked.style.cssText = `display:flex;flex-direction:column;gap:${stackedGap}px;align-items:stretch;width:100%;max-width:300px`;
  for (let i = 0; i < 3; i++) {
    const btn = _el('div');
    btn.textContent = ['Option A','Option B','Option C'][i];
    btn.style.cssText = `padding:10px 16px;border-radius:100px;border:1px solid #c9beb9;
      text-align:center;cursor:pointer;background:#fff;${descTypo};color:${textCol || '#633f28'}`;
    btn.addEventListener('mouseenter', () => { btn.style.background = '#f5f0ed'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#fff'; });
    stacked.appendChild(btn);
  }
  wrap.appendChild(stacked);

  // Side-by-side layout
  const sideLabel = _el('div','preview-label');
  sideLabel.textContent = 'Side by side layout';
  sideLabel.style.marginTop = '16px';
  wrap.appendChild(sideLabel);

  const side = _el('div');
  side.style.cssText = `display:flex;gap:${sideGap}px;align-items:center;flex-wrap:wrap`;
  for (let i = 0; i < 3; i++) {
    const btn = _el('div');
    btn.textContent = ['Option A','Option B','Option C'][i];
    btn.style.cssText = `padding:10px 16px;border-radius:100px;border:1px solid #c9beb9;
      text-align:center;cursor:pointer;background:#fff;${descTypo};color:${textCol || '#633f28'}`;
    btn.addEventListener('mouseenter', () => { btn.style.background = '#f5f0ed'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#fff'; });
    side.appendChild(btn);
  }
  wrap.appendChild(side);

  // Description
  if (descTypo || textCol) {
    const descLabel = _el('div','preview-label');
    descLabel.textContent = 'Description text';
    descLabel.style.marginTop = '16px';
    wrap.appendChild(descLabel);
    const desc = _el('div');
    desc.textContent = 'Select one of the options above to continue.';
    desc.style.cssText = `${descTypo};color:${textCol || '#633f28'}`;
    wrap.appendChild(desc);
  }

  return wrap;
};

/* ─── Component name → builder mapping ─────────────────────────── */

const PREVIEW_MAP = {
  'Buttons': 'buildButtons',
  'Icons': 'buildIcons',
  'Illustrations': 'buildIllustrations',
  'Radio': 'buildRadio',
  'Checkbox': 'buildCheckbox',
  'Switch': 'buildSwitch',
  'Inputs': 'buildInputs',
  'validationList': 'buildValidationList',
  'dropdownList': 'buildDropdownList',
  'slider': 'buildSlider',
  'grabber': 'buildGrabber',
  'breadcrumbs': 'buildBreadcrumbs',
  'Spinner': 'buildSpinner',
  'segmentedControl': 'buildSegmentedControl',
  'primaryTab': 'buildPrimaryTab',
  'carouselControls': 'buildCarouselControls',
  'badges': 'buildBadges',
  'tags': 'buildTags',
  'avatar': 'buildAvatar',
  'starRating': 'buildStarRating',
  'Step': 'buildStep',
  'Progress': 'buildProgress',
  'datePicker': 'buildDatePicker',
  'buttonDock': 'buildButtonDock',
  'filterTabs': 'buildFilterTabs',
  'dividers': 'buildDividers',
  'pictureSelector': 'buildPictureSelector',
  'buttonGroup': 'buildButtonGroup',
};
