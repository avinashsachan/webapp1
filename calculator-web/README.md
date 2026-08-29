# Orbit Tools

Orbit Tools is a lightweight browser-based utility app containing a calculator
and a Unix timestamp converter. It is implemented with plain HTML, CSS, and
JavaScript and served as static files by Nginx.

## Features

- Basic calculator operations: addition, subtraction, multiplication, and division
- Decimal values, sign toggling, percentages, clear, and equals actions
- Keyboard-enabled calculator input
- Unix timestamp conversion tool
- Responsive dark-themed interface

## Run locally

Open `index.html` directly in a browser, or serve the project with any static
file server.

## Run with Podman

Podman must have an active machine on macOS. Build and start the application with:

```bash
bash build.sh
```

The default container is named `orbit-calculator` and is available at:

```text
http://localhost:8080
```

To customize the image, container, port, or runtime:

```bash
IMAGE_NAME=my-calculator \
CONTAINER_NAME=my-calculator \
PORT=9090 \
CONTAINER_RUNTIME=podman \
bash build.sh
```

Useful container commands:

```bash
podman ps
podman logs orbit-calculator
podman stop orbit-calculator
podman rm orbit-calculator
```

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Calculator page |
| `script.js` | Calculator behavior and keyboard handling |
| `timestamp.html` | Unix timestamp page |
| `timestamp.js` | Timestamp conversion behavior |
| `styles.css` | Shared application styling |
| `Dockerfile` | Nginx container image definition |
| `build.sh` | Builds the image and starts the Podman container |
| `spec.md` | Functional and technical product specification |
