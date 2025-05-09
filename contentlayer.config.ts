import { defineDocumentType, ComputedFields, makeSource } from 'contentlayer2/source-files'
import { writeFileSync } from 'fs'
import readingTime from 'reading-time'
import { slug } from 'github-slugger'
import path from 'path'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
// Remark packages
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { remarkAlert } from 'remark-github-blockquote-alert'
import {
  remarkExtractFrontmatter,
  remarkCodeTitles,
  remarkImgToJsx,
  extractTocHeadings,
} from 'pliny/mdx-plugins/index.js'
// Rehype packages
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeKatexNoTranslate from 'rehype-katex-notranslate'
import rehypeCitation from 'rehype-citation'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypePresetMinify from 'rehype-preset-minify'
import siteMetadata from './data/siteMetadata'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer.js'
import prettier from 'prettier'

const root = process.cwd()
const isProduction = process.env.NODE_ENV === 'production'

// heroicon mini link
const icon = fromHtmlIsomorphic(
  `
  <span class="content-header-link">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 linkicon">
  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
  </svg>
  </span>
`,
  { fragment: true }
)

const computedFields: ComputedFields = {
  readingTime: { type: 'json', resolve: (doc) => readingTime(doc.body.raw) },
  slug: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath.replace(/^.+?(\/)/, ''),
  },
  path: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath,
  },
  filePath: {
    type: 'string',
    resolve: (doc) => doc._raw.sourceFilePath,
  },
  headings: { type: 'json', resolve: (doc) => extractTocHeadings(doc.body.raw) },
}

/**
 * Count the occurrences of all tags across blog posts and write to json file
 */
async function createTagCount(allBlogs) {
  const tagCount: Record<string, number> = {}
  allBlogs.forEach((file) => {
    // 首先尝试使用顶层的tags
    if (file.tags && file.tags.length > 0 && (!isProduction || file.draft !== true)) {
      file.tags.forEach((tag) => {
        const formattedTag = slug(tag)
        if (formattedTag in tagCount) {
          tagCount[formattedTag] += 1
        } else {
          tagCount[formattedTag] = 1
        }
      })
    }
    // 如果顶层tags为空但有headingSummaries，则从中提取标签
    else if (
      file.headingSummaries &&
      file.headingSummaries.length > 0 &&
      (!isProduction || file.draft !== true)
    ) {
      // 直接处理所有headingSummaries中的标签，不进行去重
      file.headingSummaries.forEach((headingItem) => {
        if (headingItem.tags && Array.isArray(headingItem.tags)) {
          headingItem.tags.forEach((tag) => {
            const formattedTag = slug(tag)
            if (formattedTag in tagCount) {
              tagCount[formattedTag] += 1
            } else {
              tagCount[formattedTag] = 1
            }
          })
        }
      })
    }
  })
  const formatted = await prettier.format(JSON.stringify(tagCount, null, 2), { parser: 'json' })
  writeFileSync('./app/tag-data.json', formatted)
}

// Define the structure of a search entry
interface SearchEntry {
  objectID: string
  title: string
  date: string | Date
  summary?: string // Summary might be optional or missing sometimes
  tags?: string[] // Tags might be optional
  kind: 'Article' | 'Heading 2'
  path: string
}

// 辅助函数：提取和处理摘要文本
function processSummary(text?: string): string {
  if (!text) return ''
  // 清理摘要中的HTML标签和多余空格
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// 辅助函数：确保所有标签的格式一致
function processTags(tags?: string[]): string[] {
  if (!tags || !Array.isArray(tags)) return []
  // 过滤空标签，确保每个标签是字符串，并去除多余空格
  return tags
    .filter((tag) => tag && typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

async function createSearchIndex(allBlogs) {
  if (
    siteMetadata?.search?.provider === 'kbar' &&
    siteMetadata.search.kbarConfig.searchDocumentsPath
  ) {
    const searchEntries: SearchEntry[] = [] // Explicitly type the array
    // 使用全部博客而不仅是最近的博客，确保所有内容可搜索
    const filteredBlogs = allBlogs.filter((blog) => {
      return !isProduction || blog.draft !== true
    })

    const sortedBlogs = sortPosts(filteredBlogs)

    for (const blog of sortedBlogs) {
      if (!blog.headingSummaries) {
        searchEntries.push({
          objectID: blog.path,
          title: blog.title,
          date: blog.date,
          summary: processSummary(blog.summary),
          tags: processTags(blog.tags),
          kind: 'Article',
          path: blog.path,
        })
      }

      // 优先使用 headingSummaries 字段
      if (blog.headingSummaries && blog.headingSummaries.length > 0 && blog.headings) {
        // 首先建立标题到URL的映射关系
        const headingToUrlMap = new Map()
        for (const heading of blog.headings) {
          if (heading.depth === 2) {
            headingToUrlMap.set(heading.value.toLowerCase(), heading.url)
          }
        }

        for (const headingItem of blog.headingSummaries) {
          // 从 headings 中查找匹配的标题以获取正确的 URL
          const headingUrl = headingToUrlMap.get(headingItem.heading.toLowerCase())

          // 如果找到匹配的 URL，使用它；否则跳过这个标题
          if (headingUrl) {
            const headingSlug = headingUrl.substring(1) // 移除开头的 # 字符

            searchEntries.push({
              objectID: `${blog.path}#${headingSlug}`,
              title: headingItem.heading,
              date: blog.date,
              summary: processSummary(headingItem.summary),
              tags: processTags(headingItem.tags || blog.tags), // 如果标题没有特定标签，使用文章标签
              kind: 'Heading 2',
              path: `${blog.path}#${headingSlug}`,
            })
          }
        }
      }
      // 后备：如果没有 headingSummaries 则使用 headings
      else if (blog.headings) {
        for (const heading of blog.headings) {
          if (heading.depth === 2) {
            const headingSlug = heading.url.substring(1)
            searchEntries.push({
              objectID: `${blog.path}#${headingSlug}`,
              title: heading.value,
              date: blog.date,
              summary: processSummary(''), // 空摘要
              tags: processTags(blog.tags), // 使用文章标签
              kind: 'Heading 2',
              path: `${blog.path}#${headingSlug}`,
            })
          }
        }
      }
    }

    // 根据日期降序和标题升序排序搜索条目
    searchEntries.sort((a, b) => {
      // 首先按日期降序排序
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateB !== dateA) {
        return dateB - dateA // 降序排列日期
      }

      // 日期相同时按标题升序排序
      return a.title.localeCompare(b.title)
    })

    const formattedEntries = await prettier.format(JSON.stringify(searchEntries, null, 2), {
      parser: 'json',
    })

    try {
      writeFileSync(
        `public/${path.basename(siteMetadata.search.kbarConfig.searchDocumentsPath)}`,
        formattedEntries
      )
      console.log('本地搜索索引已生成，包含所有文章和章节标题。')
    } catch (error) {
      console.error('写入搜索索引文件时出错:', error)
    }
  }
}

export const Blog = defineDocumentType(() => ({
  name: 'Blog',
  filePathPattern: 'blog/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    tags: { type: 'list', of: { type: 'string' }, default: [] },
    lastmod: { type: 'date' },
    draft: { type: 'boolean' },
    summary: { type: 'string' },
    cover: { type: 'string' },
    images: { type: 'json' },
    authors: { type: 'list', of: { type: 'string' } },
    layout: { type: 'string' },
    bibliography: { type: 'string' },
    canonicalUrl: { type: 'string' },
    headingSummaries: { type: 'json', default: [] },
  },
  computedFields: {
    ...computedFields,
    structuredData: {
      type: 'json',
      resolve: (doc) => ({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: doc.title,
        datePublished: doc.date,
        dateModified: doc.lastmod || doc.date,
        description: doc.summary,
        image: doc.images ? doc.images[0] : siteMetadata.socialBanner,
        url: `${siteMetadata.siteUrl}/${doc._raw.flattenedPath}`,
      }),
    },
  },
}))

export const Authors = defineDocumentType(() => ({
  name: 'Authors',
  filePathPattern: 'authors/**/*.mdx',
  contentType: 'mdx',
  fields: {
    name: { type: 'string', required: true },
    avatar: { type: 'string' },
    occupation: { type: 'string' },
    company: { type: 'string' },
    email: { type: 'string' },
    twitter: { type: 'string' },
    bluesky: { type: 'string' },
    linkedin: { type: 'string' },
    github: { type: 'string' },
    layout: { type: 'string' },
  },
  computedFields,
}))

export default makeSource({
  contentDirPath: 'data',
  documentTypes: [Blog, Authors],
  mdx: {
    cwd: process.cwd(),
    remarkPlugins: [
      remarkExtractFrontmatter,
      remarkGfm,
      remarkCodeTitles,
      remarkMath,
      remarkImgToJsx,
      remarkAlert,
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          headingProperties: {
            className: ['content-header'],
          },
          content: icon,
        },
      ],
      rehypeKatex,
      rehypeKatexNoTranslate,
      [rehypeCitation, { path: path.join(root, 'data') }],
      [rehypePrismPlus, { defaultLanguage: 'js', ignoreMissing: true }],
      rehypePresetMinify,
    ],
  },
  onSuccess: async (importData) => {
    const { allBlogs } = await importData()
    await Promise.all([createTagCount(allBlogs), createSearchIndex(allBlogs)])
  },
})
