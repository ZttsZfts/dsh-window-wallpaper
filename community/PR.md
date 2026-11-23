# Add ZttsZfts/dsh-window-wallpaper

This PR adds one entry under **Themes & Appearance** for a DSH Web GUI plugin that sets one background image behind the whole window and makes the shell panels translucent.

- Repository: https://github.com/ZttsZfts/dsh-window-wallpaper
- Package: `dsh-window-wallpaper`
- Manifest: the root `package.json` declares `dsh.bundle` (`./cordis.patch.yml`) and `dsh.client` (`./client.js`, platform `web`).
- Install: `dsh plugin --profile web add github:ZttsZfts/dsh-window-wallpaper`
- Compatibility: `engines.dsh` is `>=0.2.2-rc.5 <0.3.0`; verified against DSH 0.2.2-rc.5 on Windows.
- Behavior: the row appears in **Settings → General → Background image**. It offers a local image picker, default gradients, scrim, panel opacity, and blur. The image is compressed into `localStorage`; the plugin makes no network request and uploads nothing.
- Category: `theme` (Themes & Appearance), because the plugin changes the Web GUI's appearance.

The repository includes a localized plugin title/description (`locale/en.json`, `locale/zh.json`), a 36×36 SVG plugin icon (`icon.svg`), a storefront tile (`assets/icon-180.png`), and a one-image detail document (`docs/DETAIL.md`, `docs/DETAIL.zh.md`). The plugin was installed and exercised in a DSH desktop profile through the plugin manager.
