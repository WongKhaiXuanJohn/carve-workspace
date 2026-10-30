# Carve Workspace

A shared home for Carve and Carve Labs, built as one public website with one source repository.

## Tools

- **Overview:** studio photography, automatic four-second crossfades, and tool navigation.
- **Heater Schedule:** integrated class-time inputs, heater instructions, copy, and WhatsApp draft preparation. Switching tools stays inside this app.
- **Bank Reconciliation:** coming soon.
- **Future Tools:** coming soon.

## Run locally

No build step or application dependencies are required. Serve the repository over HTTP:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. JavaScript modules require HTTP rather than opening index.html as a local file.

With Node.js 22 or later, check the source and heater calculations:

```sh
npm run check
npm test
```

## Heater rules

- After a gap, all heaters switch on 20 minutes before class.
- For classes exactly one hour apart, the last two rows switch on five minutes before the next class.
- Shutdown is 35 minutes after the start, except starts from noon through 3 PM inclusive, which use 30 minutes.
- If another class immediately follows, switch off the last two rows; otherwise switch off all.
- Classes must start at least 60 minutes apart. Events crossing midnight explicitly identify the adjacent day.

The operating rules and normal generated message were migrated from [carve-lab-heater-scheduler](https://github.com/WongKhaiXuanJohn/carve-lab-heater-scheduler), commit `cb60d1ee2ff6f06cbe6e84f2626108b980314df9`. The original is retained as a test fixture so future changes can be checked against it. No external scheduler is required by this application.

## Source layout

- `index.html`: the shared shell and tool sections.
- `assets/modules.js`: tool labels, routes, and navigation metadata.
- `assets/app.js`: routing and accessible mobile navigation.
- `assets/gallery.js`: automatic photography and reduced-motion handling.
- `assets/heater.js`: scheduling rules and WhatsApp URL preparation.
- `assets/heater-ui.js`: the integrated heater form and copy/share actions.
- `tests/heater.test.js`: scheduling, message compatibility, validation, and day-boundary checks.

Module links use URL hashes, so bookmarked tools and browser Back/Forward work on GitHub Pages. Assets use relative paths for repository-based hosting. The stylesheet link includes a content-version query to refresh cached styling; update that version when changing the CSS.

## Publish

In GitHub Settings → Pages, choose **Deploy from a branch**, then **main**, **/ (root)**. `.nojekyll` keeps the static source unchanged.

This is a public website and repository. Heater inputs stay in the current browser page; there is no database, account system, analytics, or automatic upload. WhatsApp receives a prepared message only when the user chooses **Open WhatsApp draft**. Nothing is sent automatically. The current phone default is preserved from the original public scheduler.

The future finance page is a placeholder. No bank records or financial upload feature is included.

## Brand assets

Carve photographs, wordmark, and supplied fonts are included for this studio website. Their rights remain with their respective owners; public repository visibility does not grant permission to reuse brand assets. Muli's supplied Open Font License is included at `assets/fonts/Muli-OFL.txt`.
