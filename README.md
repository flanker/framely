# Framely

A browser extension built with [WXT](https://wxt.dev), providing enhanced functionality for your browsing experience.

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
# Firefox
pnpm dev:firefox
```

WXT will launch a browser with the extension preloaded. To load it manually instead:

1. Open your browser's extension management page:

   - Chrome: `chrome://extensions/`
   - Firefox: `about:debugging#/runtime/this-firefox`
   - Edge: `edge://extensions/`

2. Enable "Developer mode"

3. Load the unpacked extension from the `.output` directory:
   - Chrome/Edge (MV3): `.output/chrome-mv3`
   - Firefox: `.output/firefox-mv2`

## Building for Production

Create a production build:

```bash
pnpm build
# Firefox
pnpm build:firefox
```

The production bundle will be generated in the `.output` directory.

To produce a distributable `.zip` for the web stores:

```bash
pnpm zip
# Firefox
pnpm zip:firefox
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Resources

- [WXT Documentation](https://wxt.dev)
