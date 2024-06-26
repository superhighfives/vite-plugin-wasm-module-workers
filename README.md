# vite-plugin-wasm-module-workers (VPWMW)

Handle bundling WASM modules like [Satori](https://github.com/vercel/satori) (Yoga and Resvg WASM) files for both Vite and Cloudflare.

Used on [code.charliegleason.com](https://code.charliegleason.com) ([GitHub repo](https://github.com/superhighfives/code.charliegleason.com)).

## Installation

```bash
npm i vite-plugin-wasm-module-workers -D
```

And then in your `vite.config.ts`:
```ts
import wasmModuleWorkers from 'vite-plugin-wasm-module-workers'

export default defineConfig({
  plugins: [
    wasmModuleWorkers(),
    // ... more plugins
  ],
})
```

You'll also need to make sure you copy the WASM files to where Cloudflare expects them, usually at the end of the build process.

For example, in your `package.json`:

```json
{
  "scripts": {
    "build": "remix vite:build && cp -f build/client/assets/*.wasm build/server/assets"
  }
}
```


## How does it work?

Let's say we're using [Satori](https://github.com/vercel/satori) to generate an og:image in our Vite Remix app.

It's important to only import `.wasm` with `?url`, which helps ensure Vite doesn't try to do anything fancy with it.

First, we import the dependencies:

```ts
import satori, { init as initSatori } from 'satori/wasm'
import { Resvg, initWasm as initResvg } from '@resvg/resvg-wasm'
import initYoga from 'yoga-wasm-web'

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
      await initResvg(resvgwasm)
      await initSatori(await initYoga(yogawasm))
      initialised = true
    }
  } catch (e) {
    initialised = true
  }

  // more fancy code
```

To trigger the plugin on a file, you'll need to have `?module` in there. For example:

```ts
import RESVG_WASM from '@resvg/resvg-wasm/index_bg.wasm?url'

const { default: resvgwasm } = await import(
  /* @vite-ignore */ `${RESVG_WASM}?module`
)
```

Once running, the main things the plugin will look out for are:

- The constant in `import RESVG_WASM from 'yoga-wasm-web/dist/yoga.wasm?url'`
- The variable name in `const { default: resvgwasm } ...`
- The constant in `${RESVG_WASM}`

> [!WARNING]
> My ability to write regualar expresions is not one of my strengths, so if things aren't working I'd recommend trying to match the imports and `const { default: whateverWarmModule } = await import...` to what it is in the example above. If you have a better handle on regex and are keen to improve it, check out [contributing](#contributing). I'm not confident how nicely this set up will play with different types of WASM imports, so here be dragons.

VPWMW will take this code on build and convert it to something Cloudflare expects:

```ts
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

Magic. ✨

## Contributing

This plugin also contains some pretty rough regular expressions to convert the code, so if you have any better suggestions for how that could work, I encourage you to [open an issue](https://github.com/superhighfives/vite-plugin-wasm-module-workers/issues) or, even better, [a PR](https://github.com/superhighfives/vite-plugin-wasm-module-workers/pulls/new).
