# Development Guide

## Project Structure

Wireframe is a single-page application built with vanilla JavaScript, HTML, and CSS. No build process or external dependencies are required.

### File Organization

```
cable-conductor-schedule/
├── index.html                 # Main HTML entry point
├── app.js                     # Core application logic (2500+ lines)
├── styles.css                 # Complete styling (600+ lines)
├── ampacity-data.js           # Wire ampacity lookup tables
├── raceway-data.js            # Conduit area lookup tables
├── voltage-drop-data.js       # Voltage drop impedance tables
├── README.md                  # User documentation
├── CHANGELOG.md               # Version history and changes
├── SECURITY.md                # Security documentation
├── LICENSE                    # MIT License
└── example/
    └── example-project.ccs    # Example project backup
```

## Architecture Overview

### Application State

The application uses a single centralized state object stored in browser `localStorage`:

```javascript
state = {
  settings: {
    projectName: "",
    clientName: "",
    clientProjectNumber: "",
    internalProjectNumber: "",
    revisionNumber: "",
    editorName: "",
    scheduleStatus: "In Progress",
    necEdition: "",
    necJurisdiction: "",
    powerFactor: 0.9,
    maxVoltageDropPercent: 3,
    cableTypes: [],
    locations: [],
  },
  cables: [],
  conduits: [],
}
```

### Core Concepts

#### Cables
Represent electrical conductors with properties:
- Number, type, purpose, length
- Material (copper/aluminum), rating (60/75/90), phases (single/three)
- Ampacity and load information
- Cable specification (AWG/KCMIL size, ground, shield, suffix)
- Parallel set grouping (up to 6 sets)

#### Conduits
Represent physical pathways with properties:
- Number, type, size, description
- Associated cables
- Fill percentage calculation
- NEC edition compliance analysis

#### Cable Types
Reusable configurations defined in settings:
- Name, material, fill type (individual/multiconductor)
- Used by cables to inherit properties

#### Locations
Equipment installation locations:
- Name, description
- Used for cable endpoints
- Special "Cable Tray" location available

### Key Functions

#### State Management
- `loadState()` - Load project from localStorage
- `persist()` - Save project to localStorage
- `emptyState()` - Create new empty project

#### Rendering
- `renderPage()` - Main render function called after state changes
- `renderDashboard()` - Overview page
- `renderCables()` - Cable schedule page
- `renderConduits()` - Conduit schedule page
- `renderVoltageDrop()` - Voltage drop analysis page
- `renderBillOfMaterials()` - BOM page
- `renderSettings()` - Settings page

#### Analysis & Calculations
- `conduitFillAnalysis()` - Calculate conduit fill percentage and NEC compliance
- `ampacityFor()` - Look up cable ampacity
- `voltageDrop()` - Calculate voltage drop
- `cableDisplayGroups()` - Group parallel sets for display

#### Utilities
- `escapeHtml()` - HTML escape user input
- `safeHttpUrl()` - Validate URLs
- `formatNumber()` - Locale-aware number formatting
- `showToast()` - Display notifications
- `persist()` - Save state

### Theme System

The application supports three themes:
- System (follows OS preference)
- Light
- Dark

Theme state is stored in `localStorage` with key `wireframe-theme-preference-v1`.

### Sidebar Preference

The sidebar can be minimized/expanded. State is stored in `localStorage` with key `wireframe-sidebar-minimized-v1`.

## Extending the Application

### Adding a New Cable Property

1. Add property to cable objects in `emptyState()`
2. Add input field to cable modal in `renderModalForNewCable()` or `renderModalForEditCable()`
3. Add display column to cable table in `renderCables()`
4. Update CSV export in `exportCables()`

### Adding a New Setting

1. Add property to `state.settings` in `emptyState()`
2. Add input field to settings form in `renderSettings()`
3. Update form submission handler in `handleSubmit()`
4. Use the setting value in calculations or display

### Adding a New Page

1. Create render function following pattern: `function renderNewPage() { return `...html...; }`
2. Add navigation button in sidebar with `data-page="new-page"`
3. Update page titles object in `setPage()`
4. Add case to `renderPage()` function
5. Import any data requirements

### Working with Modals

Modal rendering follows a pattern:

```javascript
function renderModalForNewItem() {
  return `<div class="modal-backdrop">
    <section class="modal" role="dialog" aria-modal="true">
      <!-- Modal content -->
    </section>
  </div>`;
}

// In event handler:
modalRoot.innerHTML = renderModalForNewItem();
modalRoot.querySelector(".modal").focus();
```

## Performance Considerations

- **Minimal DOM Updates**: Only changed sections are re-rendered
- **Event Delegation**: Uses event delegation for efficiency
- **Data Lookup Tables**: Static data files loaded once
- **Local Storage**: Browser handles optimization
- **Large Projects**: Performance is acceptable for 100+ cables/conduits

## Browser Compatibility

The application uses modern JavaScript features:
- ES6+ syntax (arrow functions, template literals, destructuring)
- `localStorage` API
- `matchMedia` for theme detection
- CSS Grid and Flexbox

**Supported Browsers:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

## Code Style Guidelines

### Naming Conventions
- **Functions**: camelCase (e.g., `renderCables`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `STORAGE_KEY`)
- **Private Functions**: Prefixed with underscore (e.g., `_processData()`)
- **CSS Classes**: kebab-case (e.g., `.cable-schedule`)

### Comments
- Use JSDoc style for major functions
- Inline comments for complex logic
- TODO/FIXME comments for future work
- Security-related comments clearly marked

### HTML Structure
- Use semantic HTML5 elements
- Proper ARIA labels for accessibility
- Consistent BEM-style class naming
- Data attributes for JS hooks

### CSS Organization
- Variable definitions at top (CSS custom properties)
- Mobile-first responsive design
- Consistent spacing and sizing scale
- Grouped related rules

## Common Tasks

### Debugging

Use browser DevTools:
```javascript
// In console:
console.log(state);                    // View current state
localStorage.getItem("wireframe-project-v1");  // View saved data
```

### Adding Error Handling

```javascript
try {
  // Operation
} catch (error) {
  console.error("Description of error", error);
  showToast("User-friendly error message", true);
  return false;
}
```

### Working with Dates

The application doesn't use date/time libraries. For timestamp needs:
```javascript
const timestamp = new Date().toISOString();
```

### Number Formatting

Always use `formatNumber()` for display:
```javascript
const displayValue = formatNumber(123.456); // "123.46"
```

### HTML Escaping

Always escape user input before rendering:
```javascript
const safe = escapeHtml(userInput);
```

## Testing

Currently, the application doesn't have automated tests. Manual testing checklist:

- [ ] Create new project
- [ ] Add cables and conduits
- [ ] Assign cables to conduits
- [ ] Export data (CSV, Print)
- [ ] Switch themes
- [ ] Minimize/expand sidebar
- [ ] Test on different screen sizes
- [ ] Save and restore project backup
- [ ] Edit existing items
- [ ] Delete items

## Version Numbering

Versions follow the pattern: `YYYY.MM.NN`

- `YYYY` - Year (e.g., 2026)
- `MM` - Month (e.g., 11 for November)
- `NN` - Release within month (e.g., 14)

The version is defined in `VERSION_HISTORY` array in `app.js`. Desktop builds
use the latest entry for their package version, removing leading zeroes from
each component (for example, `2026.01.00` becomes `2026.1.0`).

## Release Checklist

Before releasing a new version:

1. [ ] Update VERSION_HISTORY with new version and changes
2. [ ] Update version numbers in index.html script tags
3. [ ] Test all major features
4. [ ] Run security audit if changes affect security
5. [ ] Update CHANGELOG.md
6. [ ] Create git commit with new version
7. [ ] Tag release with version number
8. [ ] Test backup/restore with actual file
9. [ ] Verify exports (CSV, Print)
10. [ ] Test theme switching
11. [ ] Clear browser storage and test fresh load

## Resources

- [MDN Web Docs](https://developer.mozilla.org/) - JavaScript, HTML, CSS reference
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - ARIA and accessibility
- [CSS-Tricks](https://css-tricks.com/) - Modern CSS techniques
- [JavaScript.info](https://javascript.info/) - In-depth JS tutorials
