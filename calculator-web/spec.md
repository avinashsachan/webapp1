# GNOC Suite Specification

## 1. Overview

GNOC Suite is a static web application for quick numerical calculations, Unix
timestamp conversions, and JSON-to-YAML conversion. The application must work without a backend,
database, authentication, or external service.

## 2. Goals

- Provide a simple calculator for common arithmetic.
- Provide a utility for converting Unix timestamps and human-readable dates.
- Keep the interface fast, responsive, and usable with a keyboard.
- Package the application as a small container served by Nginx.

## 3. Functional requirements

### 3.1 Calculator

The calculator must:

- Accept digits from `0` through `9` and decimal points.
- Support addition, subtraction, multiplication, and division.
- Support clear, sign toggle, percentage, and equals actions.
- Display the current expression and result.
- Prevent invalid input from producing an unhandled error.
- Support the calculator buttons and equivalent keyboard input.

### 3.2 Unix timestamp tool

The timestamp tool must:

- Display the current Unix timestamp.
- Convert a Unix timestamp into a readable date and time.
- Convert a date and time into a Unix timestamp.
- Clearly identify the expected timestamp unit and date format.
- Surface invalid or incomplete input to the user.

### 3.3 Base64 tool

The Base64 tool must:

- Encode text strings into standard Base64 representation.
- Support URL-safe Base64 encoding and decoding (RFC 4648 §5).
- Support full multi-byte UTF-8 character encoding and decoding.
- Decode Base64 strings into readable text.
- Surface encoding/decoding errors (e.g. invalid characters, malformed Base64).
- Allow one-click copying of the converted result.

### 3.4 JSON/YAML tool

The JSON-to-YAML tool must:

- Validate standard JSON input and surface syntax errors.
- Convert JSON objects, arrays, strings, numbers, booleans, and null values to readable YAML.
- Convert common YAML mappings, arrays, and scalar values back to formatted JSON.
- Allow one-click copying of the converted result.

### 3.5 Navigation

The application must provide navigation across all tools (calculator, timestamp,
Base64, and JSON/YAML). The active tool must be visually distinguishable.

## 4. User interface requirements

- Use a responsive layout suitable for desktop and mobile screens.
- Maintain readable contrast between text, controls, and background.
- Provide accessible labels for calculator controls.
- Expose calculation results through an appropriate live region.
- Preserve the shared visual language across both tools.

## 5. Technical requirements

- Use plain HTML, CSS, and browser JavaScript.
- Do not require a build step or runtime package installation.
- Serve the static files with Nginx in the container.
- Expose container port `80`.
- The default host port is `8080`, configurable through `build.sh`.
- The container image must include all HTML, CSS, and JavaScript assets required
  by the application.

## 6. Deployment

The deployment workflow is:

1. Build the image from `Dockerfile`.
2. Remove any existing container with the configured name.
3. Start the new container with the configured host port.
4. Serve the application from Nginx.

The default image and container name is `gnoc-suite`. The default URL is
`http://localhost:8080`.

## 7. Acceptance criteria

- The tools hub page loads at `/` (`index.html`) displaying all available utilities as interactive cards.
- The calculator page loads at `/cal.html` and performs the supported arithmetic operations.
- The timestamp page loads at `/timestamp.html` and performs both conversion directions.
- The Base64 page loads at `/base64.html` and performs encoding and decoding.
- The JSON/YAML page loads at `/json-yaml.html` and performs both conversion directions.
- Navigation links work from all pages back to the hub and between tools.
- The application can be built and started with `bash build.sh`.
- The running container responds successfully at the configured HTTP URL.
- No backend or external network connection is required for normal operation.
