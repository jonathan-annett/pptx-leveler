# PPTX Leveler

Match the loudness of every audio and video clip across a batch of PowerPoint files.

**Use it:** https://pptx-leveler.jonathan-max-annett.workers.dev/

- Drop in a set of `.pptx` files. The app measures each clip's loudness (ITU-R BS.1770-4) over the part that actually plays, picks the quietest clip as the reference, and turns every other clip down to match by changing PowerPoint's per-clip volume setting.
- It saves normalised copies as `name_normalized.pptx` in a folder you choose. Your original files and the media inside them are never re-encoded or changed.
- Everything runs in your browser. Files are read from and written to your own computer; nothing is uploaded.

Needs Chrome or Edge on Windows or macOS (for folder access and WebCodecs).

This repository contains only the published web app (built files). The source and build tools are kept separately.
