# dotLottie + State Machine Integration Skill

Use this file as context for any LLM that needs to integrate a `.lottie` animation with an optional state machine into this project or a similar static HTML/CSS/JS site.

This skill supports both:

- local `.lottie` files inside the repo
- remote `.lottie` files loaded by URL

## Goal

Integrate a `.lottie` asset into an existing UI element using the **`@lottiefiles/dotlottie-web`** core library, with:

- a fallback static image
- support for a local `.lottie` asset path
- support for a raw GitHub `.lottie` URL
- automatic conversion of raw GitHub URLs to a CDN-friendly URL
- optional `stateMachineId` passed into the player config
- no custom hover plumbing unless explicitly required

## Important Rules

1. Use **`@lottiefiles/dotlottie-web`**, not `lottie-web`.
2. Prefer a `canvas` render target.
3. Keep the fallback image in the markup.
4. Hide the fallback only after the lottie player is ready.
5. If the `.lottie` file already contains its own interaction logic, do **not** add manual `postStateMachineEvent`, `stateMachineSetBooleanInput`, or pointer listeners unless the user explicitly asks for authored-code interactivity.
6. If a state machine should be active by default, pass `stateMachineId` in the constructor config.

## Reference Pattern

### HTML

```html
<div
  class="nav-logo"
  data-lottie-src="assets/logo.lottie"
  data-lottie-state-machine="stateMachine"
>
  <canvas class="nav-logo-canvas" aria-hidden="true"></canvas>
  <img src="assets/Navlogo.svg" alt="Logo" class="nav-logo-fallback" />
</div>
```

Notes:

- `data-lottie-src` is the source of truth.
- `data-lottie-src` may be:
  - a local path like `assets/logo.lottie`
  - a raw GitHub URL
  - a direct CDN URL
- `data-lottie-state-machine` is optional.
- If no state machine is needed, omit the attribute.

### CSS

```css
.nav-logo {
  position: relative;
  width: 56px;
  height: 56px;
  overflow: hidden;
}

.nav-logo-canvas,
.nav-logo-fallback {
  width: 100%;
  height: 100%;
  display: block;
}

.nav-logo-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: auto;
}

.nav-logo-fallback {
  position: relative;
  z-index: 0;
  pointer-events: none;
}

.nav-logo[data-lottie-ready="true"] .nav-logo-fallback {
  opacity: 0;
}
```

Notes:

- The canvas should sit above the fallback.
- The fallback should not capture pointer events.
- This prevents the hidden fallback image from interfering with lottie interaction.

### JavaScript

```js
const navLogo = document.querySelector('.nav-logo');

function normalizeLottieSrc(urlOrPath) {
  if (!urlOrPath) return '';

  const trimmedValue = urlOrPath.trim();
  const rawGithubMatch = trimmedValue.match(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+\.lottie)$/i,
  );

  if (rawGithubMatch) {
    const [, owner, repo, ref, assetPath] = rawGithubMatch;
    return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${ref}/${assetPath}`;
  }

  return trimmedValue;
}

async function initNavLogoLottie() {
  if (!navLogo) return;

  const lottieSrc = navLogo.dataset.lottieSrc;
  const stateMachineId = navLogo.dataset.lottieStateMachine;
  if (!lottieSrc) return;

  const canvas = navLogo.querySelector('.nav-logo-canvas');
  const src = normalizeLottieSrc(lottieSrc);
  if (!canvas || !src) return;

  const { DotLottie } = await import('https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm');

  const dotLottieConfig = {
    autoplay: true,
    loop: true,
    canvas,
    src,
    renderConfig: {
      autoResize: true,
    },
    layout: {
      fit: 'contain',
      align: [0.5, 0.5],
    },
  };

  if (stateMachineId) {
    dotLottieConfig.stateMachineId = stateMachineId;
  }

  new DotLottie(dotLottieConfig);
  navLogo.dataset.lottieReady = 'true';
}

initNavLogoLottie();
```

## URL Conversion Rule

If the user gives a GitHub URL in this form:

```text
https://github.com/OWNER/REPO/blob/REF/path/file.lottie
```

Convert it to:

```text
https://raw.githubusercontent.com/OWNER/REPO/REF/path/file.lottie
```

Then let the helper convert that raw URL to:

```text
https://cdn.jsdelivr.net/gh/OWNER/REPO@REF/path/file.lottie
```

Why:

- raw GitHub URLs are convenient for users to paste
- jsDelivr GitHub CDN URLs are better for loading assets in the player

If the user gives a local file path such as:

```text
assets/logo.lottie
```

use it directly as `data-lottie-src` with no conversion.

## State Machine Guidance

If the state machine should simply be active, do this:

- provide `data-lottie-state-machine="STATE_MACHINE_ID"`
- pass `stateMachineId` into the `DotLottie` constructor config

Do **not** automatically add:

- `stateMachineLoad(...)`
- `stateMachineStart(...)`
- `postStateMachineEvent(...)`
- `stateMachineSetBooleanInput(...)`
- custom pointerenter / pointermove / pointerleave wiring

Only add manual state-machine control if the user explicitly says the `.lottie` needs code-driven interaction because the authored file does not self-handle it.

## Debugging Checklist

If the animation does not appear:

1. Check that the final `.lottie` URL resolves.
2. If using a local file, check that the path is correct relative to the HTML file.
3. Check console errors from the module import or asset fetch.
4. Confirm the canvas exists and has non-zero width and height.
5. Confirm the fallback image is still visible if lottie fails.

If the animation appears but the state machine behavior does not:

1. Confirm `data-lottie-state-machine` exactly matches the embedded state machine ID.
2. Remove any manual event plumbing that may fight the authored interactivity.
3. Ensure the fallback image is not intercepting interaction.
4. Verify the `.lottie` itself was authored to react automatically in `dotlottie-web`.

If hover appears broken:

1. Make sure the canvas is above the fallback.
2. Make sure the fallback has `pointer-events: none`.
3. Do not assume wrapper hover equals canvas hover.
4. If the file still does not react, the problem is likely in the `.lottie` authoring, not in CSS stacking.

## Project-Specific Notes

- In this repo, the nav logo is the current integration point.
- The current integration uses:
  - markup in `index.html`
  - rendering logic in `main.js`
  - layering/fallback behavior in `style.css`
- The preferred behavior in this repo is:
  - autoplay enabled
  - loop enabled
  - state machine activation by `stateMachineId` in config
  - no manual code-driven state-machine inputs unless explicitly requested

## Default Recommendation

When an LLM needs to integrate a `.lottie` asset in this codebase, it should:

1. Add a wrapper element with `data-lottie-src`
2. Add a `canvas` plus fallback `img`
3. If the source is a raw GitHub URL, convert it to jsDelivr GitHub CDN form
4. If the source is a local repo file, use the relative asset path directly
5. Initialize `DotLottie` with `autoplay`, `loop`, `canvas`, `src`
6. Pass `stateMachineId` only if the user asks for a specific state machine
7. Avoid adding custom interaction code unless the user explicitly asks for code-driven state machine behavior
