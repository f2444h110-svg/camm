# Petal & Paper — aesthetic photo editor

A free, browser-based photo editor and collage maker with a soft coquette / vintage look.
There's no build step and no account. Photos never leave the device.

## Run it

Open `index.html` in a modern browser (Chrome, Edge, Firefox or Safari). An internet connection is
needed the first time, to load fabric.js, the Lucide icons and Google Fonts from their CDNs.

You can also serve the folder with any static server, for example `npx serve .`.

## What's inside

| File | Purpose |
| --- | --- |
| `index.html` | Layout: top bar, tool rail, side panel, canvas stage |
| `css/styles.css` | Theme tokens (light "blush" and dark "noir"), glass panels, mobile layout |
| `js/assets.js` | Hand-drawn SVG stickers, cut-out frames, paper textures, text and quote presets |
| `js/assets-extra.js` | Digicam/Y2K pack: extra stickers, frames, collage layouts, backgrounds, fonts and presets |
| `js/assets-more.js` | Mega pack: colourway stickers, tags, doodles, washi, shaped/device/paper/decor frames, layouts, textures, fonts, looks |
| `js/app.js` | Editor: fabric.js canvas, frames and clipping, crop, filters, text, layers, undo, export |

## Features

- **Photos:** drag and drop, file picker, or paste (Ctrl+V). Large photos are downscaled to 2400 px.
- **Frames (121), in 9 categories:** classic, coquette, vintage, digicam & Y2K, collage layouts (up to 3×3), shapes (circle, hexagon, star, flower, speech bubble, shield…), devices & social (phone, laptop, retro TV, Y2K monitor, social post, story), paper (postcard, ticket, magazine, receipt, scrapbook), and decorated borders. Put a photo in any frame with **Put in frame**, by dragging it onto the window, or by double-clicking the window.
- **Stickers (282) and 56 quotes:** florals, coquette (bows, hearts, butterflies and stars in 14 colourways), vintage, digicam & Y2K, tags & words, cute things, doodles and washi tape. Your own PNG stickers are saved in the browser.
- **Filters (108 looks):** Retro Cam, Digicam, Film, Soft, B&W, Seasons & travel, Cinema, Decades, Colour pop and Duotone. A look-strength slider controls each look, and 20 adjustments include glow, VHS scanlines, RGB split and a digicam date stamp.
- **Canvas:** size presets, colour or paper backgrounds, and a vignette, film grain and light leak, dust & scratches finish. 31 paper and pattern backgrounds, 24 colours and 17 size presets (social, wallpaper, print).
- **Text:** 59 fonts (including 7-segment LCD), 30 presets, 16 one-click effects (neon, glitch, gold foil, fire, ice, comic…), 16 gradient fills, curve, shadow, outline and label.
- **Editing:** move, scale, rotate, crop (free or fixed ratio), layer order, flip, lock, opacity,
  duplicate, delete, undo/redo, Group / Ungroup (Ctrl+G), and a layers panel with drag-to-reorder, rename, duplicate, delete, hide and lock.
- **Export:** PNG or JPEG at 1×, 2× or 3× with no watermark.

## Shortcuts

| Keys | Action |
| --- | --- |
| Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y | Undo / redo |
| Ctrl+D | Duplicate |
| Delete / Backspace | Delete the selection |
| Arrow keys (Shift for ×10) | Nudge |
| Enter / Esc | Apply / cancel a crop |
