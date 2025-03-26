# Framely

A browser extension built with [Plasmo](https://docs.plasmo.com/), providing enhanced functionality for your browsing experience.

## Installation

```bash
pnpm install
# or
npm install
```

## Development

Start the development server:

```bash
pnpm dev
# or
npm run dev
```

### Loading the Extension

1. Open your browser's extension management page:

   - Chrome: `chrome://extensions/`
   - Firefox: `about:debugging#/runtime/this-firefox`
   - Edge: `edge://extensions/`

2. Enable "Developer mode"

3. Load the unpacked extension from the `build` directory:
   - For Chrome/Edge (MV3): `build/chrome-mv3-dev`
   - For Firefox: `build/firefox-mv2-dev`

## Building for Production

Create a production build:

```bash
pnpm build
# or
npm run build
```

The production bundle will be generated in the `build` directory, ready for distribution.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Resources

- [Plasmo Documentation](https://docs.plasmo.com/)
