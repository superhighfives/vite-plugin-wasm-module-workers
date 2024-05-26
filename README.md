# vite-plugin-wasm-module-workers (VPWMW)

Used on code.charliegleason.com to handle bundling Satori (Yoga) and Resvg WASM files for both Vite and Cloudflare.

## How does it work?

Let's say we're using Satori to generate an og:image in our Vite Remix app.

First, we import the dependencies:

```ts
import YOGA_WASM from 'yoga-wasm-web/dist/yoga.wasm?url'
import RESVG_WASM from '@resvg/resvg-wasm/index_bg.wasm?url'
```

Then, in our default function:

```ts
export async function createOGImage(title: string, requestUrl: string) {
  const { default: resvgwasm } = await import(
    /* @vite-ignore */ `${RESVG_WASM}?module`
  )
  const { default: yogawasm } = await import(
    /* @vite-ignore */ `${YOGA_WASM}?module`
  )

  try {
    if (!initialised) {
      await initWasm(resvgwasm)
      await initSatori(await initYoga(yogawasm))
      initialised = true
    }
  } catch (e) {
    initialised = true
  }

  // more fancy code
```

VPWMW will take this code on build and convert it to something Cloudflare expects:

```ts
)
import YOGA_WASM from './assets/yoga-CP4IUfLV.wasm'
import RESVG_WASM from './assets/index_bg-Blvrv-U2.wasm'
let initialised = false

async function createOGImage(title, requestUrl) {
  const resvgwasm = RESVG_WASM
  const yogawasm = YOGA_WASM
  try {
    if (!initialised) {
      await initWasm(resvgwasm)
      await init(await initYoga(yogawasm))
      initialised = true
    }
  } catch (e) {
    initialised = true
  }

  // more fancy build code
```

Magic. ✨ This plugin also contains some pretty rough regular expressions to convert the code, so if you have any better suggestions for how that could work, I encourage you to [open an issue](https://github.com/superhighfives/vite-plugin-wasm-module-workers/issues) or, even better, [a PR](https://github.com/superhighfives/vite-plugin-wasm-module-workers/pulls/new).
