// SVG Inserter Tool
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const svgInserterState = {
    iconCache: new Map(),
    componentCache: new Map(),
    lastCacheRefresh: null,
    initialized: false,
    iconData: null,
    currentFilter: "",
    currentSearch: "",
};
export const svgInserter = {
    init() {
        if (svgInserterState.initialized)
            return;
        svgInserterState.initialized = true;
        initSvgInserter();
    },
};
function initSvgInserter() {
    return __awaiter(this, void 0, void 0, function* () {
        // Load components first (shows loading screen)
        yield refreshComponentCache(true);
        // Then load icons and setup listeners
        yield loadIcons();
        setupEventListeners();
        // Hide loading screen, show content
        const loadingEl = document.getElementById("svg-loading");
        const contentEl = document.getElementById("svg-content");
        if (loadingEl) {
            loadingEl.style.display = "none";
        }
        if (contentEl) {
            contentEl.style.display = "block";
        }
    });
}
function loadIcons() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch("./icons.json");
            const iconData = yield response.json();
            svgInserterState.iconData = iconData;
            // Populate group filter dropdown
            const groupFilter = document.getElementById("group-filter");
            if (groupFilter) {
                groupFilter.innerHTML = '<option value="">All Groups</option>';
                for (const group of iconData.groups) {
                    const option = document.createElement("option");
                    option.value = group;
                    option.textContent = formatGroupName(group);
                    groupFilter.appendChild(option);
                }
            }
            // Pre-fetch all SVG content
            for (const icon of iconData.icons) {
                const svgResponse = yield fetch(`./${icon.path}`);
                const svgContent = yield svgResponse.text();
                svgInserterState.iconCache.set(icon.name, svgContent);
            }
            // Render icons
            filterAndRenderIcons();
        }
        catch (error) {
            console.error("Failed to load icons:", error);
            const noIconsMsg = document.getElementById("no-icons-message");
            if (noIconsMsg) {
                noIconsMsg.style.display = "block";
            }
        }
    });
}
function formatGroupName(group) {
    if (group === "ungrouped")
        return "Ungrouped";
    return group
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
function fuzzyMatch(text, pattern) {
    if (!pattern)
        return true;
    const lowerText = text.toLowerCase();
    const lowerPattern = pattern.toLowerCase();
    let patternIdx = 0;
    for (let i = 0; i < lowerText.length && patternIdx < lowerPattern.length; i++) {
        if (lowerText[i] === lowerPattern[patternIdx]) {
            patternIdx++;
        }
    }
    return patternIdx === lowerPattern.length;
}
function filterAndRenderIcons() {
    const grid = document.getElementById("icon-grid");
    const noIconsMsg = document.getElementById("no-icons-message");
    if (!grid || !noIconsMsg)
        return;
    grid.innerHTML = "";
    const iconData = svgInserterState.iconData;
    if (!iconData || iconData.icons.length === 0) {
        noIconsMsg.style.display = "block";
        return;
    }
    const { currentFilter, currentSearch } = svgInserterState;
    const filteredIcons = iconData.icons.filter((icon) => {
        const matchesGroup = !currentFilter || icon.group === currentFilter;
        const matchesSearch = fuzzyMatch(icon.name, currentSearch);
        return matchesGroup && matchesSearch;
    });
    if (filteredIcons.length === 0) {
        noIconsMsg.style.display = "block";
        noIconsMsg.textContent = currentSearch || currentFilter
            ? "No icons match your filters."
            : "No icons found. Add .svg files to the icons/ folder.";
        return;
    }
    noIconsMsg.style.display = "none";
    for (const icon of filteredIcons) {
        const svgContent = svgInserterState.iconCache.get(icon.name);
        if (!svgContent)
            continue;
        const btn = document.createElement("button");
        btn.className = "icon-btn";
        btn.title = `${icon.name} (${icon.group})`;
        btn.innerHTML = svgContent;
        btn.addEventListener("click", () => handleIconClick(icon.name));
        grid.appendChild(btn);
    }
}
function setupEventListeners() {
    const insertBtn = document.getElementById("insert-custom-btn");
    const textarea = document.getElementById("custom-svg-input");
    const refreshBtn = document.getElementById("refresh-cache-btn");
    const groupFilter = document.getElementById("group-filter");
    const searchInput = document.getElementById("icon-search");
    if (insertBtn && textarea) {
        insertBtn.addEventListener("click", () => {
            const svgCode = textarea.value.trim();
            if (svgCode) {
                insertSvg(svgCode);
            }
            else {
                webflow.notify({ type: "Error", message: "Please enter SVG code" });
            }
        });
    }
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            refreshComponentCache(true);
        });
    }
    if (groupFilter) {
        groupFilter.addEventListener("change", () => {
            svgInserterState.currentFilter = groupFilter.value;
            filterAndRenderIcons();
        });
    }
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            svgInserterState.currentSearch = searchInput.value;
            filterAndRenderIcons();
        });
    }
}
function refreshComponentCache() {
    return __awaiter(this, arguments, void 0, function* (showNotification = false) {
        const statusEl = document.getElementById("cache-status");
        if (statusEl) {
            statusEl.textContent = "Refreshing...";
        }
        try {
            svgInserterState.componentCache.clear();
            const components = yield webflow.getAllComponents();
            let cachedCount = 0;
            for (const component of components) {
                const name = yield component.getName();
                if (name.toLowerCase().startsWith("icon")) {
                    svgInserterState.componentCache.set(name, component);
                    cachedCount++;
                }
            }
            svgInserterState.lastCacheRefresh = new Date();
            updateCacheStatus();
            if (showNotification) {
                webflow.notify({
                    type: "Success",
                    message: `Cached ${cachedCount} icon components`,
                });
            }
        }
        catch (error) {
            console.error("Cache refresh error:", error);
            if (statusEl) {
                statusEl.textContent = "Refresh failed";
            }
        }
    });
}
function updateCacheStatus() {
    const statusEl = document.getElementById("cache-status");
    if (!statusEl)
        return;
    const count = svgInserterState.componentCache.size;
    const lastRefresh = svgInserterState.lastCacheRefresh;
    if (lastRefresh) {
        const timeStr = lastRefresh.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        statusEl.textContent = `${count} cached @ ${timeStr}`;
    }
    else {
        statusEl.textContent = "Not cached";
    }
}
function handleIconClick(iconName) {
    const svgContent = svgInserterState.iconCache.get(iconName);
    if (svgContent) {
        insertSvg(svgContent, iconName);
    }
}
function insertSvg(svgString_1) {
    return __awaiter(this, arguments, void 0, function* (svgString, svgName = "Custom") {
        var _a;
        const selectedElement = yield webflow.getSelectedElement();
        if (!selectedElement) {
            webflow.notify({
                type: "Error",
                message: "Please select an element first",
            });
            return;
        }
        const createAsComponent = (_a = document.getElementById("create-component-toggle")) === null || _a === void 0 ? void 0 : _a.checked;
        // Only check children capability for raw SVG insertion
        if (!createAsComponent && !selectedElement.children) {
            webflow.notify({
                type: "Error",
                message: "Selected element cannot contain children",
            });
            return;
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, "image/svg+xml");
        const svgElement = doc.querySelector("svg");
        if (!svgElement) {
            webflow.notify({ type: "Error", message: "Invalid SVG code" });
            return;
        }
        const parseError = doc.querySelector("parsererror");
        if (parseError) {
            webflow.notify({ type: "Error", message: "SVG parsing failed" });
            return;
        }
        try {
            if (createAsComponent) {
                const nameInput = document.getElementById("component-name-input");
                const customName = nameInput === null || nameInput === void 0 ? void 0 : nameInput.value.trim();
                const formattedName = formatComponentName(svgName);
                const componentName = customName || `Icon / ${formattedName}`;
                // Check if component already exists (sync cache lookup)
                let componentDef = getComponentFromCache(componentName);
                if (componentDef) {
                    // Component exists - just insert instance
                    // Use append if available, otherwise use after
                    if (selectedElement.children) {
                        yield selectedElement.append(componentDef);
                    }
                    else {
                        yield selectedElement.after(componentDef);
                    }
                    webflow.notify({
                        type: "Success",
                        message: `Inserted "${componentName}" instance`,
                    });
                }
                else {
                    // Register via body to avoid visual flash in selected element
                    const rootElement = yield webflow.getRootElement();
                    if (!(rootElement === null || rootElement === void 0 ? void 0 : rootElement.children)) {
                        webflow.notify({
                            type: "Error",
                            message: "Cannot access root element",
                        });
                        return;
                    }
                    const style = yield getOrCreateStyle("u-svg");
                    const svgBuilder = buildSvgElement(svgElement);
                    if (style) {
                        svgBuilder.setStyles([style]);
                    }
                    // Insert to body, register, remove, then insert instance to selected
                    const tempElement = yield rootElement.append(svgBuilder);
                    componentDef = yield webflow.registerComponent(componentName, tempElement);
                    tempElement.remove();
                    // Cache the newly created component
                    svgInserterState.componentCache.set(componentName, componentDef);
                    // Use append if available, otherwise use after
                    if (selectedElement.children) {
                        yield selectedElement.append(componentDef);
                    }
                    else {
                        yield selectedElement.after(componentDef);
                    }
                    webflow.notify({
                        type: "Success",
                        message: `Component "${componentName}" created!`,
                    });
                }
            }
            else {
                // No component - just insert raw SVG (children check already done above)
                const style = yield getOrCreateStyle("u-svg");
                const svgBuilder = buildSvgElement(svgElement);
                if (style) {
                    svgBuilder.setStyles([style]);
                }
                if (selectedElement.children) {
                    yield selectedElement.append(svgBuilder);
                }
                webflow.notify({ type: "Success", message: "SVG inserted!" });
            }
        }
        catch (error) {
            console.error("Insert error:", error);
            webflow.notify({ type: "Error", message: "Failed to insert SVG" });
        }
    });
}
function buildSvgElement(svgElement) {
    const svgBuilder = webflow.elementBuilder(webflow.elementPresets.DOM);
    svgBuilder.setTag("svg");
    for (const attr of Array.from(svgElement.attributes)) {
        if (attr.name !== "width" && attr.name !== "height") {
            svgBuilder.setAttribute(attr.name, attr.value);
        }
    }
    processChildren(svgBuilder, svgElement);
    return svgBuilder;
}
function processChildren(parent, node) {
    for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child;
            const childBuilder = parent.append(webflow.elementPresets.DOM);
            childBuilder.setTag(el.tagName.toLowerCase());
            for (const attr of Array.from(el.attributes)) {
                childBuilder.setAttribute(attr.name, attr.value);
            }
            processChildren(childBuilder, el);
        }
    }
}
function formatComponentName(iconName) {
    return iconName
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
function getComponentFromCache(name) {
    return svgInserterState.componentCache.get(name) || null;
}
function getOrCreateStyle(styleName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existing = yield webflow.getStyleByName(styleName);
            if (existing) {
                return existing;
            }
            return yield webflow.createStyle(styleName);
        }
        catch (error) {
            console.error("Style error:", error);
            return null;
        }
    });
}
