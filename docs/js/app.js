/**
 * App — main entry point.
 *
 * Fetches tokens.json, initialises the parser, builds navigation,
 * and renders sections on demand via hash routing.
 */

(async function () {
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('content');
  const navList = document.getElementById('nav-list');

  // ── Fetch & Parse ────────────────────────────────────────────────
  let parser;
  try {
    const resp = await fetch('../tokens.json');
    if (!resp.ok) throw new Error('Failed to load tokens.json: ' + resp.status);
    const json = await resp.json();
    parser = new TokenParser();
    parser.parse(json);
  } catch (err) {
    content.innerHTML = `<div class="error"><h1>Error loading tokens</h1><p>${err.message}</p>
      <p>Make sure <code>tokens.json</code> is in the repository root (one level up from <code>docs/</code>).</p></div>`;
    return;
  }

  // ── Section registry ─────────────────────────────────────────────
  const primitives = parser.getPrimitives();
  const semanticColours = parser.getSemanticColours();
  const semanticTypo = parser.getSemanticTypography();
  const semanticDim = parser.getSemanticDimensions();
  const components = parser.getComponents();

  const sections = [
    { id: 'colours', label: 'Colour Primitives', icon: '&#9632;' },
    { id: 'colour-semantics', label: 'Colour Semantics', icon: '&#9672;' },
    { id: 'spacing-sizing', label: 'Spacing & Sizing', icon: '&#8596;' },
    { id: 'typography', label: 'Typography', icon: 'A' },
    { id: 'borders', label: 'Borders', icon: '&#9633;' },
    { id: 'opacity', label: 'Opacity', icon: '&#9681;' },
  ];

  const componentNames = Object.keys(components).sort();

  // ── Build nav ────────────────────────────────────────────────────
  function buildNav() {
    navList.innerHTML = '';

    for (const s of sections) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + s.id;
      a.innerHTML = `<span class="nav-icon">${s.icon}</span> ${s.label}`;
      a.dataset.section = s.id;
      li.appendChild(a);
      navList.appendChild(li);
    }

    // Components heading
    const heading = document.createElement('li');
    heading.className = 'nav-heading';
    heading.textContent = 'Components';
    navList.appendChild(heading);

    for (const name of componentNames) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      const slug = 'component-' + slugify(name);
      a.href = '#' + slug;
      a.textContent = name;
      a.dataset.section = slug;
      li.appendChild(a);
      navList.appendChild(li);
    }
  }

  // ── Render section ───────────────────────────────────────────────
  const cache = {};

  function renderSection(id) {
    if (cache[id]) return cache[id];

    let node;
    switch (id) {
      case 'colours':
        node = Renderer.renderColourPrimitives(primitives.colours);
        break;
      case 'colour-semantics':
        node = Renderer.renderColourSemantics(semanticColours, parser);
        break;
      case 'spacing-sizing':
        node = Renderer.renderSpacingSizing(primitives.dimension, semanticDim, parser);
        break;
      case 'typography':
        node = Renderer.renderTypography(primitives, semanticTypo, parser);
        break;
      case 'borders':
        node = Renderer.renderBorders(primitives.dimension, semanticDim, parser);
        break;
      case 'opacity':
        node = Renderer.renderOpacity(primitives.opacity, parser);
        break;
      default:
        // component section
        if (id.startsWith('component-')) {
          const compName = componentNames.find(n => 'component-' + slugify(n) === id);
          if (compName) {
            node = Renderer.renderComponent(compName, components[compName], parser);
          }
        }
    }

    if (node) cache[id] = node;
    return node;
  }

  // ── Routing ──────────────────────────────────────────────────────
  function showAll() {
    content.innerHTML = '';
    // Render all core sections
    for (const s of sections) {
      const node = renderSection(s.id);
      if (node) content.appendChild(node);
    }
    // Render all components
    for (const name of componentNames) {
      const node = renderSection('component-' + slugify(name));
      if (node) content.appendChild(node);
    }
    updateActiveNav('');
  }

  function showSection(id) {
    content.innerHTML = '';
    const node = renderSection(id);
    if (node) {
      content.appendChild(node);
    } else {
      showAll();
      return;
    }
    updateActiveNav(id);
  }

  function updateActiveNav(activeId) {
    navList.querySelectorAll('a').forEach(a => {
      a.classList.toggle('active', a.dataset.section === activeId);
    });
  }

  function route() {
    const hash = location.hash.replace('#', '');
    if (!hash) {
      showAll();
    } else {
      showSection(hash);
    }
  }

  // ── Init ─────────────────────────────────────────────────────────
  buildNav();
  route();
  window.addEventListener('hashchange', route);

  // Mobile sidebar toggle
  const toggle = document.getElementById('sidebar-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Close sidebar on nav click (mobile)
  navList.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });
})();
