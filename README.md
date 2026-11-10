# Volume Fix

Even out the audio levels of every clip across a batch of PowerPoint files.

**Use it:** https://volume-fix.com/

- Drop in a set of `.pptx` files. Volume Fix measures each audio and video clip's loudness (ITU-R BS.1770-4) over the part that actually plays, takes the quietest clip as the reference, and turns every other clip down to match by changing PowerPoint's per-clip volume setting.
- It saves normalised copies as `name_normalized.pptx` in a folder you choose, plus a reference tone deck and a batch log. Your original files and the media inside them are never re-encoded or changed.
- Everything runs in your browser. Files are read from and written to your own computer; nothing is uploaded.

Needs Chrome or Edge on Windows or macOS (for folder access and WebCodecs).

## Check it yourself: nothing is uploaded

This repository is exactly what https://volume-fix.com/ serves. There is no server-side code: every file here is sent to your browser as-is.

- **The browser enforces it.** [`_headers`](_headers) gives every page a Content-Security-Policy with `connect-src 'self' blob: data:` and `form-action 'none'`. That means the browser itself blocks any network request to anywhere except volume-fix.com, so the page couldn't send your files elsewhere even if it tried. You can see the same header in your browser's developer tools (Network tab → the page request → Response headers).
- **The code is readable.** [`app.js`](app.js) (the page) and [`worker.js`](worker.js) (measuring and saving) are published unminified. Your files reach the code through the browser's file and folder pickers, and are only ever written back to the folder you choose.
- **No third-party scripts.** Everything loads from this site; the only other files are the ffmpeg.wasm decoder in [`vendor/`](vendor) (gzipped to fit the host's size limit).

## Support

If Volume Fix saves you time, you can buy me a coffee:

[![Buy me a coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=%E2%98%95&slug=sophtwhere&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/sophtwhere)

---

This repository contains only the published web app (built files). The source and build tools are kept separately.
