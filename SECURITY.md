# Security Policy

## Security Considerations

Wireframe is a browser-based application designed for use in local environments and stores all project data locally in browser storage. This document outlines the security characteristics of the application.

### Data Storage & Privacy

- **Local Storage Only**: All project data is stored exclusively in the browser's `localStorage` and is never transmitted to any external server
- **No Network Communication**: The application does not make external API calls or transmit data over the network
- **User Control**: Users maintain complete control over their data and can export, backup, or delete projects at any time
- **Backup Format**: Project backups are stored as JSON files that users can inspect and validate

### Input Validation & Sanitization

- **HTML Escaping**: User-provided input (project names, notes, descriptions) is escaped when rendered in HTML contexts using the `escapeHtml()` utility function
- **URL Validation**: External URLs (if used) are validated against http/https protocols using the `safeHttpUrl()` function
- **Number Validation**: Numeric inputs are validated using JavaScript's `Number.isFinite()` to ensure only valid numbers are processed
- **Template Injection Prevention**: All HTML rendering uses internally-generated templates; user input is never directly interpolated into HTML strings

### DOM Security

- **innerHTML Usage**: The application uses `innerHTML` to render generated HTML content. This is safe because:
  - All HTML templates are generated internally within the application
  - User input is escaped before being embedded in templates
  - No external HTML or untrusted content is ever rendered via `innerHTML`
  
- **Event Delegation**: Event listeners are properly implemented using event delegation and form handling to prevent injection attacks

### Browser Security Features

Wireframe relies on browser security features:
- Same-Origin Policy for localStorage isolation
- Content Security Policy recommended for deployment
- Modern browser security sandboxing

### Recommended Deployment Practices

If deploying Wireframe in a managed environment, consider:
- Serving over HTTPS only
- Setting appropriate Content Security Policy headers
- Running in isolated browser contexts
- Regular browser updates for security patches
- Disabling devtools in production if applicable

### Audit Trail

A comprehensive security audit was conducted in v2026.11.14:
- Reviewed all DOM manipulation patterns
- Verified input validation procedures
- Confirmed data handling security
- Audited error handling and state management
- No vulnerabilities were identified

### Reporting Security Issues

If you discover a security issue, please email security concerns to the project maintainers rather than opening a public issue. This allows for responsible disclosure and prompt resolution.

### Dependencies

This project has minimal dependencies:
- Core application uses vanilla JavaScript (no external frameworks)
- Data files (ampacity, raceway, voltage drop) are static lookup tables
- All functionality is built into the single HTML file and JavaScript bundle

### Version History

Each release documents security-related changes and improvements in the CHANGELOG.md file.
