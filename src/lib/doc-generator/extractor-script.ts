/**
 * Webflow Component Extractor Script
 *
 * This script is meant to be run in the Webflow Designer console.
 * It extracts all component data and copies it to the clipboard.
 */

export const EXTRACTOR_SCRIPT = `(() => {
  // ╔════════════════════════════════════════════════╗
  // ║  CONFIG                                        ║
  // ╠════════════════════════════════════════════════╣
  // ║  MODE: 'single' = one component                ║
  // ║        'all'    = every component on the site   ║
  // ║  COMPONENT_ID: UUID of the component (single)  ║
  // ╚════════════════════════════════════════════════╝

  const MODE = 'all';
  const COMPONENT_ID = '824b76d0-0ddb-5ed5-8ae6-09771aaa568a'; // Button Main

  // ════════════════════════════════════════════════
  // SHARED RESOURCES (loaded once)
  // ════════════════════════════════════════════════

  const state = window._webflow.getState();
  const components = JSON.parse(JSON.stringify(state.DesignerStore.get('components')));
  const sitePlugin = components.__SitePlugin;

  const sbs = state.StyleBlockStore.toJS();
  const allStyleBlocks = sbs.styleBlocks || {};
  const breakpoints = sbs.breakpoints || {};

  let styleMap = {};
  for (const [id, block] of Object.entries(allStyleBlocks)) {
    if (block && block.name) {
      styleMap[id] = { name: block.name, type: block.type || null, comb: block.comb || null };
    }
  }

  const componentNameMap = {};
  for (const [id, c] of Object.entries(sitePlugin)) {
    componentNameMap[id] = c.displayName || id;
  }

  const cssVarsStore = state.CssVariablesStore.variables;
  const cssVarCollections = JSON.parse(JSON.stringify(state.CssVariablesStore.variableCollections || {}));
  const modeNameMap = {};
  for (const [colId, col] of Object.entries(cssVarCollections)) {
    if (col.modes) {
      for (const [modeId, mode] of Object.entries(col.modes)) {
        modeNameMap[modeId] = { modeName: mode.name, collectionName: col.name };
      }
    }
  }

  console.log(\`📊 \${Object.keys(styleMap).length} styles, \${Object.keys(breakpoints).length} breakpoints, \${Object.keys(sitePlugin).length} components\`);

  // ════════════════════════════════════════════════
  // SHARED FUNCTIONS
  // ════════════════════════════════════════════════

  function parseDataType(obj) {
    const props = [];
    const seen = new Set();
    function dig(o) {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(dig); return; }
      if (o.type === 'RowCons' && o.val?.type?.system) {
        const propId = o.val.label;
        const sys = o.val.type.system;
        const innerType = o.val.type;
        const meta = innerType.meta?.value || null;
        const typeVal = innerType.val;
        let typeStr = 'Unknown';
        let typeDetail = null;
        if (innerType.type === 'TypeApplication') {
          const conVal = typeVal?.con?.val;
          if (Array.isArray(conVal)) typeStr = conVal.join('/');
          else typeStr = innerType.type;
          if (typeVal?.arg) typeDetail = typeVal.arg;
        } else if (Array.isArray(typeVal)) {
          typeStr = typeVal.join('/');
        } else if (typeof typeVal === 'string') {
          typeStr = typeVal;
        }
        const rawLabel = sys.label || propId;
        let group = null, name = rawLabel;
        const slashIdx = rawLabel.indexOf('/');
        if (slashIdx !== -1) { group = rawLabel.substring(0, slashIdx); name = rawLabel.substring(slashIdx + 1); }
        if (propId && !seen.has(propId)) {
          seen.add(propId);
          props.push({
            id: propId, label: rawLabel, group, name, type: typeStr, typeDetail,
            defaultValue: sys.defaultValue ?? null, isBindable: sys.isBindable ?? false,
            isPrivate: sys.private ?? false, isDefault: sys.isDefault ?? null,
            isUnlinked: sys.isUnlinked ?? null, toolTip: sys.toolTipText || null,
            min: meta?.min ?? null, max: meta?.max ?? null, meta
          });
        }
      }
      Object.values(o).forEach(dig);
    }
    dig(obj);
    return props;
  }

  function unwrap(v) {
    if (!v || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(unwrap);
    if (v.type === 'Select') {
      const result = { _binding: true, from: v.val?.from?.val || v.val?.from, prop: v.val?.prop };
      if (v.val?.transform) result.transform = unwrap(v.val.transform);
      return result;
    }
    if (v.type === 'Variable') return { _variable: v.val };
    if (v.type === 'Apply') return { _apply: true, fn: unwrap(v.val?.fn || v.val?.[0]), arg: unwrap(v.val?.arg || v.val?.[1]) };
    if (v.type === 'Conditional' || v.type === 'If') return { _conditional: true, condition: unwrap(v.val?.condition), then: unwrap(v.val?.then), else: unwrap(v.val?.else) };
    if (['Text', 'Boolean', 'Enum', 'Number'].includes(v.type) && v.val !== undefined) return v.val;
    if (v.type === 'List') return Array.isArray(v.val) ? v.val.map(unwrap) : [];
    if (v.type === 'Record' && v.val && typeof v.val === 'object' && !Array.isArray(v.val)) {
      const out = {}; for (const [k, val] of Object.entries(v.val)) out[k] = unwrap(val); return out;
    }
    if (v.type === 'Typed' && v.val) return { _typed: true, ...unwrapSafe(v.val) };
    return v;
  }
  function unwrapSafe(v) { const r = unwrap(v); return (r && typeof r === 'object' && !Array.isArray(r)) ? r : { value: r }; }

  function getChildrenArray(c) {
    if (!c) return null;
    if (c.type === 'List' && Array.isArray(c.val)) return c.val;
    if (Array.isArray(c)) return c;
    if (c.val && Array.isArray(c.val)) return c.val;
    if (c.type === 'Select') return [c];
    if (c.type) return [c];
    return null;
  }

  function resolveStylesFull(ids) {
    if (!ids || !Array.isArray(ids)) return null;
    return ids.map(id => {
      const block = allStyleBlocks[id];
      if (!block) return { id, className: '(unresolved)' };
      const result = { id, className: block.name, type: block.type || null, comb: block.comb || null, baseCSS: block.styleLess || null };
      if (block.variants && Object.keys(block.variants).length) {
        result.variantCSS = {};
        for (const [varKey, varData] of Object.entries(block.variants)) {
          const decoded = decodeVariantKey(varKey, {});
          result.variantCSS[varKey] = { breakpoint: decoded.breakpoint, variant: decoded.variant, css: varData.styleLess || null };
        }
      }
      return result;
    });
  }

  function decodeVariantKey(key, variantValueNames) {
    const underscoreIdx = key.indexOf('_');
    if (underscoreIdx === -1) return { breakpoint: key, variant: null };
    const bp = key.substring(0, underscoreIdx);
    const rest = key.substring(underscoreIdx + 1);
    const eqIdx = rest.indexOf('=');
    if (eqIdx === -1) return { breakpoint: bp, variant: rest };
    const propId = rest.substring(0, eqIdx);
    const valueId = rest.substring(eqIdx + 1);
    return { breakpoint: bp, breakpointName: breakpoints[bp]?.id || bp, variantPropId: propId, variantValueId: valueId, variantName: variantValueNames[valueId] || valueId };
  }

  function parseElement(node) {
    if (!node || typeof node !== 'object') return node;
    if (node.type !== 'Element') return unwrap(node);
    const v = node.val;
    const el = { id: v.id, type: Array.isArray(v.type) ? v.type.join('/') : v.type };
    if (Array.isArray(v.type) && v.type[0] === '__SitePlugin') {
      el.componentName = componentNameMap[v.type[1]] || '(unknown)';
      el.componentId = v.type[1];
    }
    if (v.meta?.displayName) el.displayName = v.meta.displayName;
    else if (v.meta?.val?.displayName) el.displayName = typeof v.meta.val.displayName === 'object' ? unwrap(v.meta.val.displayName) : v.meta.val.displayName;
    if (v.meta) {
      const mu = unwrap(v.meta);
      if (mu && typeof mu === 'object') { const { displayName, ...rest } = mu; if (Object.keys(rest).length) el.meta = rest; if (displayName && !el.displayName) el.displayName = displayName; }
    }
    let dataVal = null;
    if (v.data?.type === 'Record' && v.data?.val) dataVal = v.data.val;
    else if (v.data?.type === 'Typed' && v.data?.val) { const typed = v.data.val; if (typed.val && typeof typed.val === 'object') dataVal = typed.val; else el.typedData = unwrap(v.data); }
    else if (v.data?.val) dataVal = v.data.val;
    if (!dataVal) { if (v.data) el.data = unwrap(v.data); return el; }
    if (dataVal.tag) el.tag = unwrap(dataVal.tag);
    if (dataVal.styleBlockIds) { const rawIds = unwrap(dataVal.styleBlockIds); el.styles = resolveStylesFull(rawIds); }
    if (dataVal.xattr) {
      let xList = [];
      if (dataVal.xattr.type === 'List' && Array.isArray(dataVal.xattr.val)) xList = dataVal.xattr.val;
      else if (Array.isArray(dataVal.xattr.val)) xList = dataVal.xattr.val;
      else if (Array.isArray(dataVal.xattr)) xList = dataVal.xattr;
      if (xList.length) el.xattr = xList.map(a => { const rec = a.type === 'Record' ? a.val : (a.val || a); return { name: unwrap(rec.name), value: unwrap(rec.value) }; });
    }
    if (dataVal.attributes) { let aList = []; if (dataVal.attributes.type === 'List' && Array.isArray(dataVal.attributes.val)) aList = dataVal.attributes.val; else if (Array.isArray(dataVal.attributes)) aList = dataVal.attributes; if (aList.length) el.attributes = aList.map(a => unwrap(a)); }
    if (dataVal.visibility) el.visibility = unwrap(dataVal.visibility);
    if (dataVal.slot) { const sv = unwrap(dataVal.slot); if (sv && sv !== '') el.slot = sv; }
    if (dataVal.name) { const nv = unwrap(dataVal.name); if (nv && nv !== '') el.name = nv; }
    if (dataVal.text) { const tv = unwrap(dataVal.text); if (tv === true) el.text = true; }
    const handledKeys = ['tag','styleBlockIds','xattr','attributes','visibility','slot','text','children','devlink','search','name'];
    for (const [k, val] of Object.entries(dataVal)) { if (!handledKeys.includes(k)) { if (!el.extra) el.extra = {}; el.extra[k] = unwrap(val); } }
    const childArr = getChildrenArray(dataVal.children);
    if (childArr && childArr.length) el.children = childArr.map(c => parseElement(c));
    return el;
  }

  // ════════════════════════════════════════════════
  // PER-COMPONENT EXTRACTION
  // ════════════════════════════════════════════════

  function extractComponent(compId, comp) {
    // Build variant name map for this component
    const variantValueNames = {};
    if (comp.variants) {
      for (const [propId, opts] of Object.entries(comp.variants)) {
        if (Array.isArray(opts)) opts.forEach(opt => { variantValueNames[opt.id] = opt.displayName; });
      }
    }

    const properties = parseDataType(comp.dataType || {});
    const renderTree = parseElement(comp.render);

    const propMap = {};
    properties.forEach(p => { propMap[p.id] = p.label; });

    // Slot display names
    const slotDisplayNames = {};
    function findSlotDisplayNames(el) {
      if (!el || typeof el !== 'object') return;
      if (Array.isArray(el)) { el.forEach(findSlotDisplayNames); return; }
      if (el.displayName && el.children) {
        el.children.forEach(child => {
          if (child?._binding && child?.prop) {
            const prop = properties.find(p => p.id === child.prop);
            if (prop && prop.type === 'Slots/SlotContent') slotDisplayNames[child.prop] = el.displayName;
          }
        });
      }
      if (el.children) el.children.forEach(findSlotDisplayNames);
    }
    findSlotDisplayNames(renderTree);

    function annotateBindings(obj) {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) { obj.forEach(annotateBindings); return; }
      if (obj._binding && obj.prop) {
        if (propMap[obj.prop]) obj.propName = propMap[obj.prop];
        if (slotDisplayNames[obj.prop]) obj.slotDisplayName = slotDisplayNames[obj.prop];
      }
      Object.values(obj).forEach(annotateBindings);
    }
    annotateBindings(renderTree);

    properties.forEach(p => {
      if (p.type === 'Slots/SlotContent' && slotDisplayNames[p.id]) p.displayName = slotDisplayNames[p.id];
    });

    // Collect CSS
    const usedStyleIds = new Set();
    function collectStyleIds(el) {
      if (!el || typeof el !== 'object') return;
      if (Array.isArray(el)) { el.forEach(collectStyleIds); return; }
      if (el.styles) el.styles.forEach(s => usedStyleIds.add(s.id));
      if (el.children) el.children.forEach(collectStyleIds);
    }
    collectStyleIds(renderTree);

    const componentCSS = {};
    for (const id of usedStyleIds) {
      const block = allStyleBlocks[id];
      if (!block) continue;
      const entry = { className: block.name, type: block.type, comb: block.comb || null, base: block.styleLess || null, variants: {} };
      if (block.variants) {
        for (const [varKey, varData] of Object.entries(block.variants)) {
          const decoded = decodeVariantKey(varKey, variantValueNames);
          entry.variants[decoded.variantName || varKey] = { breakpoint: decoded.breakpoint, variantName: decoded.variantName || null, css: varData.styleLess || null };
        }
      }
      componentCSS[block.name] = entry;
    }

    // Embeds
    const embeds = [];
    function findEmbeds(el) {
      if (!el || typeof el !== 'object') return;
      if (Array.isArray(el)) { el.forEach(findEmbeds); return; }
      if (el.type === 'Basic/HtmlEmbed' || el.type === 'Builtin/HtmlEmbed' || (el.type && typeof el.type === 'string' && el.type.includes('Embed'))) {
        embeds.push({ id: el.id, type: el.type, displayName: el.displayName || null, content: el.extra?.html || el.extra?.code || el.extra?.embed || el.extra || null, styles: el.styles || null });
      }
      if (el.extra?.embedCode || el.extra?.html) {
        embeds.push({ id: el.id, type: el.type, tag: el.tag || null, content: el.extra.embedCode || el.extra.html });
      }
      if (el.children) el.children.forEach(findEmbeds);
    }
    findEmbeds(renderTree);

    // Resolve CSS variables
    const varRefs = new Set();
    for (const id of usedStyleIds) {
      const block = allStyleBlocks[id];
      if (!block) continue;
      const allCss = [block.styleLess || ''];
      if (block.variants) Object.values(block.variants).forEach(v => { if (v.styleLess) allCss.push(v.styleLess); });
      allCss.join(' ').replace(/@var_(variable-[a-f0-9-]+)/g, (_, ref) => { varRefs.add(ref); });
    }

    const resolvedVars = {};
    const resolveQueue = [...varRefs];
    const resolvedSet = new Set();

    function resolveVarValue(val) {
      if (!val) return null;
      if (val.type === 'length' && val.value) return \`\${val.value.value}\${val.value.unit}\`;
      if (val.type === 'number' && val.value) return val.value.value;
      if (val.type === 'color') {
        const cv = val.value;
        if (typeof cv === 'string') return cv;
        if (cv?.type === 'color') return typeof cv.value === 'string' ? cv.value : JSON.stringify(cv.value);
        if (cv?.hex) return cv.hex;
        if (cv?.r !== undefined) return \`rgba(\${cv.r}, \${cv.g}, \${cv.b}, \${cv.a ?? 1})\`;
        return JSON.stringify(cv);
      }
      if (val.type === 'ref' && val.value?.variableId) {
        const refId = val.value.variableId;
        if (!resolvedSet.has(refId)) resolveQueue.push(refId);
        return \`@ref:\${refId}\`;
      }
      if (val.type === 'raw' && val.value) {
        val.value.replace(/@var_(variable-[a-f0-9-]+)/g, (_, ref) => { if (!resolvedSet.has(ref)) resolveQueue.push(ref); });
        return val.value;
      }
      return JSON.stringify(val);
    }

    while (resolveQueue.length) {
      const varId = resolveQueue.shift();
      if (resolvedSet.has(varId)) continue;
      resolvedSet.add(varId);
      try {
        const v = cssVarsStore.get(varId);
        if (!v) continue;
        const plain = v.toJS ? v.toJS() : v;
        const entry = { name: plain.name, type: plain.type, value: resolveVarValue(plain.value) };
        if (plain.modes && Object.keys(plain.modes).length) {
          entry.modes = {};
          for (const [modeId, modeVal] of Object.entries(plain.modes)) {
            const modeInfo = modeNameMap[modeId];
            const key = modeInfo ? \`\${modeInfo.collectionName}/\${modeInfo.modeName}\` : modeId;
            entry.modes[key] = resolveVarValue(modeVal);
          }
        }
        resolvedVars[varId] = entry;
      } catch(e) {}
    }

    function resolveRefChain(val) {
      if (typeof val !== 'string') return val;
      if (val.startsWith('@ref:')) {
        const refId = val.substring(5);
        const target = resolvedVars[refId];
        if (target) return \`var(\${target.name}) → \${resolveRefChain(target.value)}\`;
        return val;
      }
      if (val.includes('@var_variable-')) {
        return val.replace(/@var_(variable-[a-f0-9-]+)/g, (match, varId) => {
          const target = resolvedVars[varId];
          if (target) return \`var(--\${target.name.replace(/\\//g, '-')})\`;
          return match;
        });
      }
      return val;
    }
    for (const [id, entry] of Object.entries(resolvedVars)) {
      entry.resolved = resolveRefChain(entry.value);
      if (entry.modes) {
        entry.modesResolved = {};
        for (const [mk, mv] of Object.entries(entry.modes)) entry.modesResolved[mk] = resolveRefChain(mv);
      }
    }

    return {
      id: compId,
      name: comp.displayName || compId,
      group: comp.groupName || null,
      description: comp.description || null,
      variants: comp.variants || {},
      properties,
      render: renderTree,
      css: componentCSS,
      embeds: embeds.length ? embeds : null,
      cssVariables: Object.keys(resolvedVars).length ? resolvedVars : null,
      _meta: { slotDisplayNames, usedStyleCount: usedStyleIds.size, embedCount: embeds.length, variablesResolved: Object.keys(resolvedVars).length }
    };
  }

  // ════════════════════════════════════════════════
  // PRINT HELPERS
  // ════════════════════════════════════════════════

  function printComponent(output) {
    console.log(\`\\n\${'═'.repeat(60)}\`);
    console.log(\`📦 \${output.group ? output.group + '/' : ''}\${output.name}\`);
    console.log('═'.repeat(60));

    const grouped = {};
    output.properties.forEach(p => { const g = p.group || '(ungrouped)'; if (!grouped[g]) grouped[g] = []; grouped[g].push(p); });

    console.log(\`\\n=== PROPERTIES (\${output.properties.length} total) ===\`);
    for (const [g, gProps] of Object.entries(grouped)) {
      console.log(\`\\n  [\${g}]\`);
      gProps.forEach(p => {
        let line = \`    \${p.name} [\${p.type}]\`;
        if (p.displayName) line += \` "\${p.displayName}"\`;
        line += \` default: \${JSON.stringify(p.defaultValue)}\`;
        if (p.min !== null || p.max !== null) line += \` range: \${p.min} to \${p.max}\`;
        if (p.toolTip) line += \`\\n      tooltip: \${p.toolTip.replace(/\\n/g, ' ')}\`;
        console.log(line);
      });
    }

    const variantEntries = Object.entries(output.variants);
    if (variantEntries.length) {
      console.log('\\n=== VARIANTS ===');
      variantEntries.forEach(([propId, opts]) => {
        const matchProp = output.properties.find(p => p.id === propId);
        console.log(\`  Property: \${matchProp ? matchProp.label : propId}\`);
        opts.forEach(v => console.log(\`    \${v.displayName} (\${v.id})\`));
      });
    }

    function printTree(el, indent) {
      if (!el || typeof el !== 'object') return;
      if (Array.isArray(el)) { el.forEach(e => printTree(e, indent)); return; }
      const prefix = '  '.repeat(indent);
      let line = prefix;
      if (el.tag) line += \`<\${el.tag}>\`;
      else if (el.componentName) line += \`[\${el.componentName}]\`;
      else if (el.type) line += \`[\${el.type}]\`;
      else if (el._binding) { line += \`{BIND: \${el.propName || el.prop}\${el.slotDisplayName ? \` "\${el.slotDisplayName}"\` : ''}}\`; console.log(line); return; }
      else line += '[node]';
      if (el.displayName) line += \` "\${el.displayName}"\`;
      if (el.id) line += \` #\${el.id.substring(0, 8)}\`;
      if (el.styles?.length) { const names = el.styles.map(s => s.className).filter(n => n && n !== '(unresolved)'); if (names.length) line += \` .\${names.join('.')}\`; }
      if (el.xattr?.length) line += \` [\${el.xattr.map(a => typeof a.name === 'string' ? a.name : '?').join(', ')}]\`;
      if (el.text) line += ' [TEXT]';
      console.log(line);
      if (el.children) el.children.forEach(c => printTree(c, indent + 1));
    }

    console.log('\\n=== RENDER TREE ===');
    printTree(output.render, 0);

    console.log('\\n=== CSS ===');
    for (const [className, data] of Object.entries(output.css)) {
      console.log(\`\\n  .\${className} {\`);
      console.log(\`    \${data.base || '(empty)'}\`);
      console.log('  }');
      for (const [vName, vData] of Object.entries(data.variants || {})) {
        console.log(\`  .\${className} [\${vData.breakpoint}/\${vName}] {\`);
        console.log(\`    \${vData.css || '(empty)'}\`);
        console.log('  }');
      }
    }

    if (output.embeds?.length) {
      console.log('\\n=== HTML EMBEDS ===');
      output.embeds.forEach((e, i) => {
        console.log(\`  Embed \${i + 1} [\${e.type}] #\${e.id?.substring(0, 8) || '?'}\`);
        if (e.content) console.log(\`    \${JSON.stringify(e.content).substring(0, 200)}\`);
      });
    }

    if (output.cssVariables) {
      console.log(\`\\n=== CSS VARIABLES (\${output._meta.variablesResolved} resolved) ===\`);
      for (const [id, entry] of Object.entries(output.cssVariables)) {
        console.log(\`  \${entry.name} [\${entry.type}] = \${typeof entry.resolved === 'string' ? entry.resolved : JSON.stringify(entry.resolved)}\`);
        if (entry.modesResolved) {
          for (const [mode, val] of Object.entries(entry.modesResolved)) {
            console.log(\`    \${mode}: \${typeof val === 'string' ? val : JSON.stringify(val)}\`);
          }
        }
      }
    }
  }

  // ════════════════════════════════════════════════
  // RUN
  // ════════════════════════════════════════════════

  if (MODE === 'single') {
    const comp = sitePlugin[COMPONENT_ID];
    if (!comp) { console.log(\`Component \${COMPONENT_ID} not found\`); return; }

    const output = extractComponent(COMPONENT_ID, comp);
    output.breakpoints = breakpoints;

    const json = JSON.stringify(output, null, 2);
    copy(json);
    printComponent(output);
    console.log(\`\\n✅ \${json.length.toLocaleString()} chars copied to clipboard\`);

  } else if (MODE === 'all') {
    const allOutputs = [];
    const compEntries = Object.entries(sitePlugin);

    for (const [compId, comp] of compEntries) {
      try {
        const output = extractComponent(compId, comp);
        allOutputs.push(output);
      } catch(e) {
        console.log(\`⚠️ Failed: \${comp.displayName || compId} — \${e.message}\`);
      }
    }

    const finalOutput = {
      breakpoints,
      components: allOutputs,
      _meta: { totalComponents: allOutputs.length, styleMapSize: Object.keys(styleMap).length }
    };

    const json = JSON.stringify(finalOutput, null, 2);
    copy(json);

    // Summary for all mode
    console.log(\`\\n\${'═'.repeat(60)}\`);
    console.log(\`📦 ALL COMPONENTS (\${allOutputs.length} total)\`);
    console.log('═'.repeat(60));
    allOutputs.forEach(o => {
      console.log(\`  \${o.group ? o.group + '/' : ''}\${o.name} — \${o.properties.length} props, \${o._meta.usedStyleCount} styles, \${o._meta.variablesResolved} vars\`);
    });

    // Full details per component
    allOutputs.forEach(o => printComponent(o));

    console.log(\`\\n✅ \${allOutputs.length} components, \${json.length.toLocaleString()} chars copied to clipboard\`);
  }
})();`;
