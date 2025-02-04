import { pathToFileURL } from 'node:url'
import { stripLiteral } from 'strip-literal'
import { parseQuery, parseURL } from 'ufo'
import MagicString from 'magic-string'
import { createUnplugin } from 'unplugin'

interface DevOnlyPluginOptions {
  sourcemap?: boolean
}

export const DevOnlyPlugin = createUnplugin((options: DevOnlyPluginOptions) => {
  const DEVONLY_COMP_RE = /<dev-?only>(:?[\s\S]*)<\/dev-?only>/gmi

  return {
    name: 'nuxt:server-devonly:transfrom',
    enforce: 'pre',
    transformInclude (id) {
      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href))
      const { type } = parseQuery(search)

      // vue files
      if (pathname.endsWith('.vue') && (type === 'template' || !search)) {
        return true
      }
    },
    transform (code, id) {
      if (!code.match(DEVONLY_COMP_RE)) { return }

      const s = new MagicString(code)
      const strippedCode = stripLiteral(code)
      for (const match of strippedCode.matchAll(DEVONLY_COMP_RE) || []) {
        s.remove(match.index!, match.index! + match[0].length)
      }

      if (s.hasChanged()) {
        return {
          code: s.toString(),
          map: options.sourcemap
            ? s.generateMap({ source: id, includeContent: true })
            : undefined
        }
      }
    }
  }
})
