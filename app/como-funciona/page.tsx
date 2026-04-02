import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote/rsc'

export default async function ComoFuncionaPage() {
  const filePath = path.join(process.cwd(), 'content', 'como-funciona.mdx')
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { content, data } = matter(fileContent)

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-4">{data.title}</h1>
      <p className="text-gray-600 mb-8">{data.description}</p>
      <article className="prose prose-lg max-w-none">
        <MDXRemote source={content} />
      </article>
    </div>
  )
}