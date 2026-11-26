# Wireframe — Cable & Conduit Schedules

Wireframe is a lightweight browser app for creating and managing electrical cable and conduit schedules, reviewing a bill of materials, and printing project reports.

## Features

- Create and manage cable and conduit schedules, including conduit cable assignments.
- Analyze conduit fill against NEC and flag passing, failing, or incomplete checks.
- Maintain project information, cable specifications, and equipment locations.
- Generate cable Spec Type values from a conductor/pair count, AWG/KCMIL size, ground/shield selection, and optional suffix.
- Look up Cable Ampacity by cable size, material, and temperature rating; parallel-set rows show the combined ampacity. Ampacity Overhead shows ampacity minus load, with negative values in red and positive values in green.
- Review cable length totals and identify entries with missing lengths.
- Review cable electrical inputs in the Voltage Drop section; parallel sets appear together in one row with all cable numbers and a combined set count. Configure its maximum voltage-drop indicator threshold and power factor in Settings. The dashboard's Recently Added Cables groups each parallel set into one row and shows its total set count. The Cable Schedule also groups sets, combines conduit assignments across members, and supports duplicating or deleting the entire set. Set cable material on each reusable cable type. Create linked parallel cable sets from Add/Edit Cable with suggested numbers that can be customized individually (up to six sets). Individual cable purpose displays identify each member as “Set x of y”; grouped Cable Schedule rows show the shared purpose once. Editing one member updates the group, and changing its set count adds or removes cable entries.
- Calculate voltage drop using the supplied NEC Chapter 9 Table 9 resistance/reactance values, cable length, phase, load, power factor, cable rating, and assigned raceway types. Parallel-set impedance is combined; multiconductor and pair results are labeled estimates using single-conductor values, while incomplete inputs show Needs data.
- Export schedules and the bill of materials as CSV files.
- Print the bill of materials and Conduit Cable Schedule.
- Choose a light or dark theme, or follow the device's appearance setting.

## Getting Started

1. Download or clone this repository.
2. Open `index.html` in a modern browser. No build step or package installation is required.
3. Use **Settings** to enter project details, cable types, and equipment locations.
4. Create schedules from the Cable Schedule and Conduit Schedule sections. Set cable material in each cable type, then enter voltage, load, rating, phase, and parallel sets in the Add/Edit Cable dialog. Suggested cable numbers for parallel sets can be edited.
5. Use **Export** for CSV files and print reports.

Project data is saved in the browser's local storage. Use **New** to start a blank project, **Save Project** to download a `.ccs` backup, and **Open Project** to restore a `.ccs` or `.json` backup. Starting a new project asks for confirmation before replacing the current project. Keep backups when moving projects to another browser or device.

For conduit-fill analysis, select the adopted NEC edition in **Settings**. Raceway area auto-populates for the supplied EMT, RMC, and PVC Schedule 40/80 size table; other raceway/size combinations require an area from the applicable NEC table or manufacturer data. The area remains editable. Cable types need an actual outside diameter and a fill classification. The app applies the standard fill percentages and the optional short-nipple limit, but does not apply local amendments or evaluate other NEC requirements. Verify code selections and dimensions with the authority having jurisdiction.

## Project Files

- `index.html` — application entry point
- `app.js` — application logic and project data handling
- `raceway-data.js` — editable raceway options and internal-area values by trade size
- `ampacity-data.js` — cable ampacities by size, material, and temperature rating
- `styles.css` — application and print styles
- `example/example-project.ccs` — sample project backup

## License

This project is available under the [MIT License](LICENSE). You may use, modify, distribute, and include it in commercial products, provided the copyright and license notice is retained. See [LICENSE](LICENSE) for the full terms.
