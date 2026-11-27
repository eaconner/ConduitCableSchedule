# App.js Function Documentation Summary

## Overview
Comprehensive JSDoc documentation has been added to all 109+ functions in `app.js`, improving code maintainability and developer experience.

## Documentation Coverage

### State Management & Persistence (5 functions)
- `emptyState()` - Creates empty project state
- `loadState()` - Loads from localStorage with error handling
- `persist()` - Saves state to localStorage
- `isCableTrayLocation()` - Checks for cable tray location
- `normalizeCableTrayLocations()` - Consolidates legacy cable tray references
- `normalizeCableTypeMaterials()` - Handles legacy material assignments

### Theme & Preferences (5 functions)
- `loadThemePreference()` - Loads theme from localStorage
- `loadSidebarPreference()` - Loads sidebar state
- `saveSidebarPreference()` - Saves sidebar preference
- `applyTheme()` - Applies theme to UI
- `saveThemePreference()` - Saves theme preference

### Utility Functions (15+ functions)
- `escapeHtml()` - HTML escaping for security
- `safeHttpUrl()` - URL validation and sanitization
- `formatNumber()` - Number formatting
- `hasScheduledLength()` - Length validation
- `renderScheduledLength()` - Length rendering with units
- `sumScheduledLengths()` - Sum of scheduled lengths
- `renderLengthSummary()` - Length summary with counts
- `renderLengthTotal()` - Total length rendering
- `sortByNumber()` - Numeric sorting with collation
- `sortCablesByPrefix()` - Sorts cables by prefix then number
- `sortByName()` - Alphabetic name sorting
- And 4 more utility functions

### Display & Navigation (5 functions)
- `showToast()` - Toast notification display
- `updateWorkspace()` - Updates sidebar information
- `setPage()` - Sets active page
- `renderPage()` - Renders current page
- `projectName()` - Gets project name with fallback

### Location Helpers (5 functions)
- `titleCaseHeading()` - Title case conversion
- `locationName()` - Gets location display name
- `normalizedLocationName()` - Normalized name for comparison
- `locationNameKey()` - Location name key for lookups
- `locationDisplayName()` - Display name with equipment ID
- `cableLocationName()` - Gets location name from cable reference

### Cable & Raceway Lookups (5+ functions)
- `cableType()` - Looks up cable type by ID
- `racewayTypeLabel()` - Gets raceway type label
- `racewayInternalAreaFor()` - Gets raceway area for fill calculations
- `cableFillTypeLabel()` - Gets cable fill type label
- `conduitFillAnalysis()` - Performs NEC fill analysis

### Major Render Functions (8 functions)
- `renderDashboard()` - Dashboard overview page
- `renderCables()` - Cable schedule page
- `renderCableRow()` - Cable table row
- `renderVoltageDrop()` - Voltage drop analysis page
- `renderVoltageDropRow()` - Voltage drop table row
- `renderConduits()` - Conduit schedule page
- `renderBillOfMaterials()` - Bill of materials page
- `renderSettings()` - Settings and configuration page
- `renderVersionHistory()` - Version history display

### Modal & Form Functions (12+ functions)
- `openModal()` - Opens modal dialog
- `closeModal()` - Closes modal dialog
- `selectField()` - Creates select field HTML
- `textField()` - Creates text input field HTML
- `cableSpecSizeField()` - Cable size select field
- `cableSpecTypeValue()` - Formats cable specification
- `updateCableSpecLabels()` - Updates spec labels dynamically
- `isCableTypeForm()` - Identifies cable type forms
- `isConduitForm()` - Identifies conduit forms
- `openCableForm()` - Opens cable editing form
- `openConduitForm()` - Opens conduit editing form
- `openCableTypeForm()` - Opens cable type form
- `openLocationForm()` - Opens location/equipment form

### Parallel Cable Handling (4 functions)
- `updateParallelNumberPreview()` - Updates parallel number preview
- `nextScheduleNumber()` - Calculates next schedule number
- `nextScheduleNumbers()` - Generates multiple consecutive numbers
- `parallelGroupMembers()` - Gets all cables in parallel group
- `cablePurposeDisplay()` - Formats cable purpose with parallel info
- `parallelNumberInputMarkup()` - Creates parallel number input HTML

### Conduit-Specific Functions (4 functions)
- `updateConduitCableOptions()` - Updates cable options in conduit form
- `updateConduitFillCondition()` - Updates fill condition fields
- `updateConduitRacewayArea()` - Updates raceway area with NEC lookups
- `cablePrefixesForConduit()` - Valid cable prefixes for conduit

### Settings & Field Helpers (5 functions)
- `settingsField()` - Creates settings input field
- `scheduleStatusField()` - Creates schedule status selector
- `options()` - Creates option HTML for select fields
- `routeLocationField()` - Creates location selection field
- `conduitSizeField()` - Creates conduit size selector
- `billOfMaterialsGroups()` - Groups materials for BOM

### Form Handling & Actions (8+ functions)
- `makeId()` - Generates unique IDs
- `handleSubmit()` - Main form submission handler
- `handleAction()` - Main action dispatcher
- `isDuplicate()` - Checks for duplicate values
- `isDuplicateEquipment()` - Checks for duplicate equipment
- `saveAndClose()` - Saves state, closes modal, renders page
- `removeRecord()` - Removes record and updates UI
- `returnToRoute()` - Returns to previous form with draft data
- `startNewProject()` - Initiates new project
- `updateWorkspace()` - Updates sidebar information

### Print Functions (4 functions)
- `renderConduitCablePrint()` - Renders conduit cable schedule for print
- `printConduitCableSchedule()` - Opens print dialog for conduit schedule
- `renderVoltageDropPrint()` - Renders voltage drop report for print
- `printVoltageDropReport()` - Opens print dialog for voltage drop
- `printReport()` - Main print dialog handler

### Export Functions (10+ functions)
- `cableExportRows()` - Generates cable schedule export rows
- `conduitExportRows()` - Generates conduit schedule export rows
- `billOfMaterialsExportRows()` - Generates BOM export rows
- `conduitCableExportRows()` - Generates combined schedule export rows
- `exportConduitCableCsv()` - Exports conduit cable schedule to CSV
- `formattedConduitCableRows()` - Formats rows with uppercase text
- `exportCsv()` - Generic CSV export with escaping
- `exportJson()` - Exports project as JSON backup
- `projectFileName()` - Generates file name with extension
- `projectFileBaseName()` - Generates sanitized base file name

### Import & Validation (4 functions)
- `validateBackupData()` - Validates backup JSON structure
- `importProjectBackup()` - Imports project from backup file
- `download()` - Triggers file download from text content
- `downloadBlob()` - Triggers file download from blob

## Documentation Standards

Each function includes:
1. **Description** - Clear explanation of purpose and behavior
2. **@param tags** - Parameter types and descriptions
3. **@returns tag** - Return type and description
4. **Notes** - Implementation details, edge cases, or dependencies

## JSDoc Format Example

```javascript
/**
 * Renders the cable schedule page with table of all cables and parallel sets.
 * Shows cable specifications, routes, and electrical properties.
 * @returns {string} HTML string for cable schedule page
 */
function renderCables() {
  // implementation...
}
```

## Benefits

- **IDE Support**: Autocomplete and inline documentation in VS Code
- **Type Checking**: Better static analysis and type inference
- **Developer Onboarding**: Clear function purposes and usage
- **Code Navigation**: Easier to understand function relationships
- **Documentation Generation**: Can be used to generate API docs with tools like JSDoc

## Verification

- ✅ All 109+ functions documented
- ✅ Syntax validation passed (Node.js)
- ✅ No breaking changes to functionality
- ✅ All existing tests passing
- ✅ Git commit: `9290f5f`

## Related Changes

- v2026.11.14: Security audit and code cleanup
- UI improvements and user experience enhancements
- Settings management and preferences
- Voltage drop analysis and reporting
