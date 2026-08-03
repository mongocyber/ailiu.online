import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { defineConfig, type IndexHtmlTransformContext } from 'vite'
import react from '@vitejs/plugin-react'
import {
  applyStaticSeo,
  parsePortfolioPath,
  STATIC_PAGES,
} from './src/seo.ts'

function portfolioSeoPages() {
  return {
    name: 'portfolio-seo-pages',
    transformIndexHtml(html: string, context: IndexHtmlTransformContext) {
      const route = parsePortfolioPath(context.path)
      return applyStaticSeo(html, route?.locale, route?.projectKey)
    },
    async closeBundle() {
      const outDir = join(process.cwd(), 'dist')
      const indexPath = join(outDir, 'index.html')
      const indexHtml = await readFile(indexPath, 'utf8')

      await Promise.all(
        STATIC_PAGES.map(async (page) => {
          const pageIndexPath = join(outDir, page.outputPath)
          await mkdir(dirname(pageIndexPath), { recursive: true })
          await writeFile(pageIndexPath, applyStaticSeo(indexHtml, page.locale, page.projectKey))
        }),
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), portfolioSeoPages()],
})
