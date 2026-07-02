import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { projects } from './src/content.ts'
import { applyStaticSeo } from './src/seo.ts'

function portfolioSeoPages() {
  return {
    name: 'portfolio-seo-pages',
    transformIndexHtml(html: string) {
      return applyStaticSeo(html)
    },
    async closeBundle() {
      const outDir = join(process.cwd(), 'dist')
      const indexPath = join(outDir, 'index.html')
      const indexHtml = await readFile(indexPath, 'utf8')

      await writeFile(indexPath, applyStaticSeo(indexHtml))

      await Promise.all(
        projects.map(async (project) => {
          const projectIndexPath = join(outDir, 'projects', project.key, 'index.html')
          await mkdir(dirname(projectIndexPath), { recursive: true })
          await writeFile(projectIndexPath, applyStaticSeo(indexHtml, project.key))
        }),
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), portfolioSeoPages()],
})
