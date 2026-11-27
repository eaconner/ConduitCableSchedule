# Changelog

All notable changes to Wireframe — Cable & Conduit Schedules are documented here.

## [v2026.11.14] - 2026-11-27

### Enhanced
- **User Interface & Experience**
  - Improved responsive layout with better visual hierarchy across all pages
  - Enhanced accessibility attributes on modals, forms, and interactive elements
  - Better sidebar navigation with refined styling and improved active state indicators
  - Cleaner settings panel with improved form control organization and field grouping

- **Code Quality & Maintainability**
  - Comprehensive JSDoc comments added for major functions and utilities
  - Improved function organization with consistent patterns throughout
  - Reduced complexity in render functions with better separation of concerns
  - Enhanced consistency in naming conventions and coding style

- **Settings & Configuration**
  - Refined settings form controls for better usability
  - Improved field organization with clearer labels and descriptions
  - Better validation feedback and error messaging

### Security
- Conducted comprehensive security audit of all DOM manipulation patterns
- Verified all `innerHTML` usage is for internally-generated templates
- Confirmed no user input is directly interpolated without sanitization
- Added security notes and documentation for future maintainers
- No vulnerabilities detected

### Fixed
- Improved error handling in state management functions
- Better error messages for storage unavailability
- More robust data normalization for legacy project formats

### Developer Experience
- Added comprehensive code comments and documentation
- Improved debugging with better console error messages
- Added security-focused documentation in source files
- Cleaned up unused styles and improved CSS organization

## [v2026.11.13] - 2026-11-25

### Added
- Cable specification builder for conductor/pair count, AWG/KCMIL size, ground/shield, and optional suffix
- Cable Ampacity lookups by size, material, and rating
- Ampacity Overhead (ampacity minus load) with combined parallel-set ampacity
- Red/green status indicators for ampacity
- Ampere units for loads
- Power Factor and Max Voltage Drop settings to Project Information
- Voltage drop calculations using Table 9 impedance
- Grouped parallel sets in Cable and Voltage Drop schedules
- Editable per-set numbering (up to six) with whole-set duplicate/delete
- Combined conduit assignments with "Set x of y" purpose suffixes
- Actions headings to Cable and Conduit Schedules
- Consistent sidebar icon styling
- Voltage Drop column alignment improvements

## [v2026.11.12] - 2026-11-20

### Added
- Conduit type to Bill of Materials and CSV export
- Grouping of conduit totals by type and size

### Changed
- Listed conduit size before type
- Sorted conduit materials by size, then type
- Added project and report names to saved project files
- Added project and report names to CSV exports
- Added project and report names to print-to-PDF titles

## [v2026.11.11] - 2026-11-18

### Added
- NEC conduit-fill analysis with pass/fail/needs-data status
- Automatic raceway area lookups for EMT, RMC, and PVC
- Support for 2017, 2020, 2023, and 2026 NEC editions

## [v2026.11.10] - 2026-11-15

### Changed
- Unified report print colors
- Highlighted conduit rows in reports
- Added multiline CCS column headings
- Kept CCS From/To values on one line
- Compacted other columns
- Prevented conduit groups from splitting across pages

## [v2026.11.09] - 2026-11-12

### Added
- Landscape Conduit Cable Schedule printout
- Project details in printout header
- Spacing between conduits in printout

## [v2026.11.08] - 2026-11-10

### Changed
- Centered Export menu chevron
- Moved BOM printing into Export menu

## [v2026.11.07] - 2026-11-08

### Added
- CSV export for Bill of Materials

## [v2026.11.06] - 2026-11-06

### Fixed
- BOM printing now respects print dialog's orientation
- Removed unwanted trailing blank page from BOM printout

## [v2026.11.05] - 2026-11-04

### Enhanced
- Widened modal windows
- Prevented backdrop clicks from dismissing modals
- Prevented text selection from dismissing modals

## [v2026.11.04] - 2026-11-02

### Changed
- Wrapped long table headings to improve readability
- Split Cable Materials into manufacturer and spec number columns
- Reordered columns with Spec Type first

## [v2026.11.03] - 2026-10-31

### Enhanced
- Cable-length summary now totals defined lengths
- Added warning when some cable lengths are missing

## [v2026.11.02] - 2026-10-29

### Added
- System-aware light and dark themes
- User-selectable appearance setting in Settings

## [v2026.11.01] - 2026-10-27

### Added
- Ability to duplicate conduits while retaining their details
- Preservation of cable assignments when duplicating conduits

## [v2026.11.00] - 2026-10-25

### Initial Release
- Create cable and conduit schedules
- Manage conduit assignments
- Group parallel cable sets
- Define reusable cable types
- Generate conductor/pair specifications
- Manage equipment locations
- Export schedules and BOM as CSV
- Print project reports
- Choose light, dark, or system-matched theme
- Browser-based storage with backup/restore capability
