# Wireframe — Cable & Conduit Schedules

Wireframe is a lightweight browser app for creating and managing electrical cable and conduit schedules, reviewing a bill of materials, and printing project reports.

## Features

- Create and manage cable and conduit schedules, including conduit cable assignments.
- Analyze conduit fill against NEC Table 1 limits and flag passing, failing, or incomplete checks.
- Maintain project information, cable specifications, and equipment locations.
- Review cable length totals and identify entries with missing lengths.
- Export schedules and the bill of materials as CSV files.
- Print the bill of materials and a landscape Conduit Cable Schedule.
- Choose a light or dark theme, or follow the device's appearance setting.

## Getting Started

1. Download or clone this repository.
2. Open `index.html` in a modern browser. No build step or package installation is required.
3. Use **Settings** to enter project details, cable types, and equipment locations.
4. Create schedules from the Cable Schedule and Conduit Schedule sections.
5. Use **Export** for CSV files and print reports.

Project data is saved in the browser's local storage. Use **Save Project** to download a `.ccs` backup and **Open Project** to restore a `.ccs` or `.json` backup. Keep backups when moving projects to another browser or device.

For conduit-fill analysis, select the adopted NEC edition in **Settings**. Raceway area auto-populates for the supplied EMT, RMC, and PVC Schedule 40/80 size table; other raceway/size combinations require an area from the applicable NEC table or manufacturer data. The area remains editable. Cable types need an actual outside diameter and a fill classification. The app applies the standard fill percentages and the optional short-nipple limit, but does not apply local amendments or evaluate other NEC requirements. Verify code selections and dimensions with the authority having jurisdiction.

## Project Files

- `index.html` — application entry point
- `app.js` — application logic and project data handling
- `raceway-data.js` — editable raceway options and internal-area values by trade size
- `styles.css` — application and print styles
- `example/example-project.ccs` — sample project backup

The CSS and JavaScript asset URLs in `index.html` share the current version-history number as a cache-busting version. Update it with each release or asset change so browsers load the latest files.

## License

This project is available under the [MIT License](LICENSE). You may use, modify, distribute, and include it in commercial products, provided the copyright and license notice is retained. See [LICENSE](LICENSE) for the full terms.
