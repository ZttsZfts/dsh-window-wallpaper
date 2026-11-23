# Publishing runbook

DSH has no official upload endpoint or default plugin index. The community listing used by the Discover tab and the `dsh-market` plugin is the **awesome-dsh-plugin** catalog; adding a plugin means opening a one-file PR against its repository. This directory contains the exact entry and PR text.

## 1. Create the public repository

Create `https://github.com/ZttsZfts/dsh-window-wallpaper` as a public repository, then push this directory to it:

```sh
git remote add origin https://github.com/ZttsZfts/dsh-window-wallpaper.git
git push -u origin main
```

Add the `dsh-plugin` topic to the repository (GitHub → About → Topics). The catalog checks for it.

The repository must be at least **1 day old** before the submission PR passes the catalog gate. That check is automatic; a rejected submission can be reopened after the wait.

## 2. Open the catalog PR

Fork `https://github.com/hulibuld/awesome-dsh-plugin`, add `data/plugins/ZttsZfts__dsh-window-wallpaper.yml` with the content of `ZttsZfts__dsh-window-wallpaper.yml`, and open one PR against `main`. Use `PR.md` as the description.

The catalog CI checks that the repository's `package.json` declares `dsh.bundle`, that the repo is old enough, and that the entry YAML is valid. Do not edit the generated READMEs.

## 3. Optional: publish to npm

The npm name `dsh-window-wallpaper` is free as of 2026-11-23. After logging in (`npm login`) and creating the package:

```sh
npm publish
```

The npm package's `repository` field already points back at the GitHub repository, which is what links the two in the catalog. Publishing is optional; GitHub-only entries install normally.

## 4. Optional: host an official-format index

If you want the plugin to be installable from **Plugins → Discover → Add index source** without the community catalog, serve a format-1 `index.json` and its icon from any static host. The official guide is `docs/user/guide/plugin-market.md` in the DSH installation. This is a separate distribution channel, not the community listing.
