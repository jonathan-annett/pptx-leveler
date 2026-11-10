# Volume Fix

Even out the audio levels of every clip across a batch of PowerPoint files.

**Use it:** https://volume-fix.com/

- Drop in a set of `.pptx` files. Volume Fix measures each audio and video clip's loudness (ITU-R BS.1770-4) over the part that actually plays, takes the quietest clip as the reference, and turns every other clip down to match by changing PowerPoint's per-clip volume setting.
- It saves normalised copies as `name_normalized.pptx` in a folder you choose, plus a reference tone deck and a batch log. Your original files and the media inside them are never re-encoded or changed.
- Everything runs in your browser. Files are read from and written to your own computer; nothing is uploaded.

Needs Chrome or Edge on Windows or macOS (for folder access and WebCodecs).

This repository contains only the published web app (built files). The source and build tools are kept separately.
