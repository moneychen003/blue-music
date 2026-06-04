import fs from 'node:fs'
import path from 'node:path'
import { env } from 'node:process'
import { fileURLToPath } from 'node:url'

import { svelte } from '@sveltejs/vite-plugin-svelte'
import pxtorem from 'postcss-pxtorem'
import { defaultClientConditions, defineConfig } from 'vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

import { createHtmlPlugin } from './build-config/html.plugin.js'
import svelteConfig, { lessConfig } from './svelte.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isProd = env.NODE_ENV == 'production'
const rootPath = path.join(dirname, '../../')
const projectPath = path.join(rootPath, 'packages/view-main')
const extraPublicDir = path.join(projectPath, 'public')

// type Target = 'desktop' | 'web'

const dirs = {
  desktop: {
    publicDir: path.join(rootPath, 'packages/desktop/dist/electron'),
    outDir: path.join(rootPath, 'packages/desktop/dist/view-main'),
  },
  web: {
    publicDir: path.join(rootPath, 'packages/web-server/server/public'),
    outDir: path.join(rootPath, 'build/public'),
  },
}

export const buildConfig = (target, port = 9200, ipcScript) => {
  const dir = dirs[target]
  const extraPublicPlugin = {
    name: 'any-listen-extra-public',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '').split('?', 1)[0])
        const fileName = url.startsWith('/') ? url.substring(1) : url
        if (!fileName || fileName.includes('/') || !fs.existsSync(path.join(extraPublicDir, fileName))) {
          next()
          return
        }
        if (fileName.endsWith('.webmanifest')) res.setHeader('Content-Type', 'application/manifest+json')
        if (fileName.endsWith('.js')) res.setHeader('Content-Type', 'text/javascript')
        fs.createReadStream(path.join(extraPublicDir, fileName)).pipe(res)
      })
    },
    closeBundle() {
      if (!fs.existsSync(extraPublicDir)) return
      fs.cpSync(extraPublicDir, dir.outDir, { recursive: true })
    },
  }

  /**
   * @type {import('vite').UserConfig}
   */
  const config = {
    // mode: process.env.NODE_ENV == 'production' ? 'production' : 'development',
    mode: target,
    root: projectPath,
    base: './',
    publicDir: isProd ? false : dir.publicDir,
    logLevel: 'warn',
    resolve: {
      alias: {
        '@': path.join(projectPath, 'src'),
        sortablejs: path.join(projectPath, 'node_modules/sortablejs/modular/sortable.core.esm.js'),
      },
      conditions: [...defaultClientConditions],
    },
    plugins: [
      svelte(svelteConfig),
      extraPublicPlugin,
      createSvgIconsPlugin({
        iconDirs: [path.join(projectPath, 'src/assets/svgs')],
      }),
      createHtmlPlugin({
        minify: true,
        scriptCSPHash: true,
        inject: {
          data: {
            envScript: fs
              .readFileSync(path.join(import.meta.dirname, 'build-config', target == 'web' ? 'web.js' : 'desktop.js'))
              .toString(),
          },
          tags: [
            {
              tag: 'meta',
              attrs: {
                charset: 'UTF-8',
              },
            },
            {
              tag: 'meta',
              attrs: {
                name: 'viewport',
                content: 'width=device-width,initial-scale=1.0',
              },
            },
            target == 'web' &&
              isProd && {
                tag: 'meta',
                attrs: {
                  'http-equiv': 'Content-Security-Policy',
                  content: "script-src 'self'",
                },
                injectTo: 'head-prepend',
              },
            ipcScript && {
              tag: 'script',
              attrs: {
                type: 'module',
                src: ipcScript,
              },
              injectTo: 'head-prepend',
            },
            // {
            //   tag: 'meta',
            //   attrs: {
            //     name: 'viewport',
            //     content: target == 'web' ? 'width=1036, initial-scale=1.0' : 'width=device-width, initial-scale=1.0',
            //   },
            //   injectTo: 'head-prepend',
            // },
          ],
        },
      }),
    ],
    build: {
      target: 'esnext',
      outDir: dir.outDir,
      modulePreload: target == 'web',
      emptyOutDir: false,
      reportCompressedSize: false,
      cssMinify: 'esbuild',
      // assetsDir: 'chunks',
      assetsDir: './',
      sourcemap: isProd,
      minify: isProd,
      watch: isProd
        ? null
        : {
            buildDelay: 500,
          },
      rolldownOptions: {
        // input: {
        //   'view-main': 'index.html',
        // },
        output: {
          entryFileNames: '[name][hash].js',
          // format: 'cjs',
          // experimentalMinChunkSize: 50_000,
          // manualChunks: {
          //   'iconv-lite': ['iconv-lite'],
          // },
        },
        logLevel: 'warn',
      },
      commonjsOptions: {
        include: [
          /vendors/,
          /node_modules/,
          // /utils\/musicMeta/,
        ],
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          ...lessConfig,
          javascriptEnabled: true,
        },
      },
      postcss: {
        plugins: [
          pxtorem({
            rootValue: 16,
            unitPrecision: 5,
            propList: [
              'font',
              'font-size',
              'letter-spacing',
              'padding',
              'margin',
              'padding-*',
              'margin-*',
              'height',
              'width',
              '*-height',
              '*-width',
              'flex',
              '::-webkit-scrollbar',
              'top',
              'left',
              'bottom',
              'right',
              'border-radius',
              'border',
              'border-*',
              'grid-template-columns',
              'gap',
            ],
            selectorBlackList: ['html', 'ignore-to-rem'],
            replace: true,
            mediaQuery: false,
            minPixelValue: 0,
            exclude: /node_modules/i,
          }),
          // autoprefixer(),
        ],
      },
    },
    optimizeDeps: {
      //   // exclude: [],
      include: [
        // '@common/utils/musicMeta',
        // '@view-main/utils/musicSdk/kg/vendors/infSign.min',
      ],
    },
    server: {
      port,
    },
    worker: {
      format: 'iife',
      rolldownOptions: {
        output: {
          entryFileNames: '[name][hash].js',
          // codeSplitting: true,
          format: 'iife',
          // experimentalMinChunkSize: 50_000,
        },
        logLevel: 'warn',
      },
      // format: 'es',
    },
    // cacheDir: path.join(projectPath, 'node_modules/.vite/view-main'),
  }

  return config
}

export default defineConfig(({ mode }) => {
  return buildConfig(mode)
})
