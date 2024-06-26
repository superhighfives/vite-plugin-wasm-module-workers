// @ts-check
import * as path from 'path'
import * as fs from 'fs'

import type { Plugin } from 'vite'
import { ResolvedConfig } from 'vite'
type LoadResult = string | null

export default function wasmModuleWorkers(): Plugin {
  const postfix = '.wasm?module'
  let isDev = false

  return {
    name: 'vite:wasm-helper',
    configResolved(config: ResolvedConfig) {
      isDev = config.command === 'serve'
    },
    config() {
      return { build: { rollupOptions: { external: /.+\.wasm?url$/i } } }
    },
    renderChunk(code: string) {
      if (isDev) return
      if (!/.*\?module.*/g.test(code)) return

      let final = code.replaceAll(/(const\s+(\w+))(.*\.wasm.*)/gm, (s) => {
        return s.replace(/const\s+(\w+)\s*=\s*"(.*)"/, 'import $1 from ".$2"')
      })

      final = final.replaceAll(/const\n*.*{\n*.*default:(\n|.)*?(;)/gm, (s) => {
        return s.replace(
          /[\s\S]*?(?=:\s):\s(\w+)[\s\S]*?(?=\{){(.*?)}[\s\S]*?(?:\);*)/gm,
          `const $1 = $2`
        )
      })

      return { code: final }
    },
    load(id: string): LoadResult {
      if (!id.endsWith(postfix)) {
        return null
      }

      const filePath = id.slice(0, -1 * '?module'.length)

      if (isDev) {
        return `
            import fs from "fs"
    
            const wasmModule = new WebAssembly.Module(fs.readFileSync("${filePath}"));
            export default wasmModule;
            `
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assetId = this.emitFile({
        type: 'asset',
        name: path.basename(filePath),
        source: fs.readFileSync(filePath),
      })

      return `
          import init from "__WASM_ASSET__${assetId}.wasm"
          export default init
          `
    },
  }
}
