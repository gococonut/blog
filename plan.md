# ByteBonfire博客改造方案

## 一、项目现有逻辑

### 1. 内容组织结构

当前的内容组织方式：

```
data/blog/
  ├── hacker-news/
  │   ├── 2025-05-01.mdx  (日期聚合文件)
  │   ├── 2025-05-02.mdx  (日期聚合文件)
  │   ├── ...
  │   └── 43905942.mdx    (单条内容文件)
  └── github-trendings/
      ├── 2025-05-01.mdx
      └── ...
```

注意：目前项目已经开始尝试单文件内容模式（如`43905942.mdx`），但大部分内容仍按日期聚合。

### 2. 内容模型

**日期聚合文件**的元数据结构：

```yaml
---
title: Hacker News
date: 2025-05-08
cover: https://hub-image.moreve.net/files/images/hacker-news/2025-05-08.png
tags: [开发工具, AI前沿, 深度分析, 社区互动]
summary: '内容简介：1. Ty: 一款基于 Rust、速度极快的 Python 类型检查器...'
---
```

**单条内容文件**的元数据结构：

```yaml
---
title: 'Show HN: Clippy - 本地LLM的90年代用户界面'
date: 2025-05-07
tags: [应用, 人工智能, 开发工具, 实验项目]
summary: '这款应用将大型语言模型带到本地桌面，最大的特色是采用了致敬90年代微软助手的Clippy界面，提供怀旧且有趣的AI体验。'
source: hacker-news
---
```

### 3. 博客展示逻辑

当前的展示方式：

- 列表页：按日期展示聚合文章
- 标签系统：直接使用文章级别的tags
- 文章页：展示完整内容，日期文件展示所有小节
- 目录导航：日期文件基于二级标题自动生成

## 二、优化方案 - 完全物理分割模式

### 1. 目标

将所有内容转换为单文件模式，即每个Hacker News文章或GitHub项目对应一个独立的MDX文件，便于更精细的内容管理和检索。

### 2. 新的文件结构

```
data/blog/
  ├── hacker-news/
  │   ├── 2025-05-01-void-opensource-cursor.mdx
  │   ├── 2025-05-01-reservoir-sampling.mdx
  │   └── ...
  └── github-trending/
      ├── 2025-05-01-tensorflow-models.mdx
      ├── 2025-05-01-nextjs-app.mdx
      └── ...
```

### 3. 单条内容文件的元数据结构

```yaml
---
title: 'Void：开源的Cursor替代品'
date: '2025-05-01'
sourceDate: '2025-05-01'
sourceType: 'hacker-news'
sourceUrl: 'https://news.ycombinator.com/item?id=43927926'
author: 'sharjeelsayed'
tags: ['开源项目', '软件开发', '人工智能', '开发者工具']
summary: 'Void是一款开源的AI驱动代码编辑器，作为Cursor的替代品，强调用户对数据和模型的控制及隐私保护。'
cover: 'https://hub-image.moreve.net/files/images/void-editor.png'
discussionUrl: 'https://news.ycombinator.com/item?id=43927926'
---
```

### 4. Contentlayer配置更新

```typescript
import { defineDocumentType, makeSource } from 'contentlayer2/source-files'

export const NewsItem = defineDocumentType(() => ({
  name: 'NewsItem',
  filePathPattern: 'blog/{hacker-news,github-trending}/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    sourceDate: { type: 'date', required: false },
    sourceType: { type: 'string', required: false },
    sourceUrl: { type: 'string', required: false },
    author: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    summary: { type: 'string', required: false },
    cover: { type: 'string', required: false },
    discussionUrl: { type: 'string', required: false },
    source: { type: 'string', required: false }, // 兼容现有单文件
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.sourceFileName.replace(/\.mdx$/, ''),
    },
    sourceType: {
      type: 'string',
      resolve: (doc) =>
        doc.sourceType ||
        doc.source ||
        (doc._raw.flattenedPath.includes('hacker-news') ? 'hacker-news' : 'github-trending'),
    },
  },
}))

export default makeSource({
  contentDirPath: 'data',
  documentTypes: [NewsItem],
  // ...其余配置
})
```

### 5. 数据迁移方案

创建一个脚本，从现有日期聚合文件中提取每个二级标题的内容并生成独立文件：

```javascript
// scripts/migrateToIndividualPosts.mjs
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import slugify from 'slugify'

async function migrateHackerNewsContent() {
  const sourceDir = path.join(process.cwd(), 'data/blog/hacker-news')
  const files = await fs.readdir(sourceDir)

  for (const file of files) {
    // 跳过已经是单独条目的文件(不含日期格式的文件名)
    if (!file.match(/^\d{4}-\d{2}-\d{2}\.mdx$/)) continue

    const filePath = path.join(sourceDir, file)
    const content = await fs.readFile(filePath, 'utf8')
    const { data, content: mdxContent } = matter(content)

    // 提取日期
    const date = file.replace(/\.mdx$/, '')

    // 使用正则表达式识别所有二级标题及其内容
    const sectionRegex = /## (.+?)\n\n([\s\S]*?)(?=\n## |$)/g
    let match

    while ((match = sectionRegex.exec(mdxContent)) !== null) {
      const heading = match[1]
      const sectionContent = match[2].trim()

      // 创建slug
      const slug = slugify(heading, {
        lower: true,
        strict: true,
        locale: 'zh-CN',
      })

      // 标题可能包含作者信息，我们需要清理掉
      let cleanTitle = heading
      if (cleanTitle.includes('**作者:**')) {
        cleanTitle = cleanTitle.split('**作者:**')[0].trim()
      }

      // 创建新的前置元数据
      const newFrontmatter = {
        title: cleanTitle,
        date: date,
        sourceDate: date,
        sourceType: 'hacker-news',
        tags: data.tags || [],
        summary: `从"${data.title} ${date}"提取的内容: ${cleanTitle}`,
        // 如果能从内容中提取更多信息，可以在这里添加
      }

      // 创建新文件名
      const newFileName = `${date}-${slug}.mdx`
      const newFilePath = path.join(sourceDir, newFileName)

      // 创建新文件内容
      const newContent = `## ${heading}\n\n${sectionContent}`
      const newFileContent = matter.stringify(newContent, newFrontmatter)

      // 写入新文件
      await fs.writeFile(newFilePath, newFileContent)
      console.log(`Created: ${newFileName}`)
    }
  }
}

migrateHackerNewsContent().catch(console.error)
```

### 6. 前端页面设计

#### 6.1 主页看板设计

```jsx
// app/page.tsx
import { allNewsItems } from 'contentlayer/generated'
import { compareDesc } from 'date-fns'
import NewsItemCard from '@/components/NewsItemCard'

export default function Dashboard() {
  // 获取最新的所有条目
  const latestItems = allNewsItems
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    .slice(0, 12)

  // 分类获取Hacker News和GitHub Trending条目
  const hackerNewsItems = latestItems.filter((item) => item.sourceType === 'hacker-news')
  const githubItems = latestItems.filter((item) => item.sourceType === 'github-trending')

  return (
    <div className="dashboard">
      <section className="featured-section">
        <h2 className="section-title">最新内容</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {latestItems.slice(0, 6).map((item) => (
            <NewsItemCard key={item.slug} item={item} featured={true} />
          ))}
        </div>
      </section>

      {/* HN和GitHub Trending部分 */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="section-title">
            <span className="icon">🔥</span> Hacker News
          </h2>
          <div className="grid gap-4">
            {hackerNewsItems.slice(0, 5).map((item) => (
              <NewsItemCard key={item.slug} item={item} />
            ))}
          </div>
          <div className="mt-4 text-right">
            <a href="/source/hacker-news" className="text-primary hover:underline">
              查看更多 →
            </a>
          </div>
        </section>

        <section>
          <h2 className="section-title">
            <span className="icon">⭐</span> GitHub Trending
          </h2>
          <div className="grid gap-4">
            {githubItems.slice(0, 5).map((item) => (
              <NewsItemCard key={item.slug} item={item} />
            ))}
          </div>
          <div className="mt-4 text-right">
            <a href="/source/github-trending" className="text-primary hover:underline">
              查看更多 →
            </a>
          </div>
        </section>
      </div>

      {/* 标签云 */}
      <aside className="mt-12">
        <h2 className="section-title">热门标签</h2>
        <TagCloud />
      </aside>
    </div>
  )
}
```

#### 6.2 内容卡片组件

```jsx
// components/NewsItemCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/utils/format'
import Tag from '@/components/Tag'

export default function NewsItemCard({ item, featured = false }) {
  const { title, summary, cover, tags, date, slug, sourceType } = item
  const href = `/posts/${sourceType}/${slug}`

  return (
    <article
      className={`bg-card rounded-lg border p-4 transition-all duration-300 hover:shadow-md ${featured ? 'row-span-2' : ''} `}
    >
      {cover && (
        <Link href={href} className="mb-3 block">
          <div className="relative h-48 overflow-hidden rounded-md">
            <Image
              src={cover}
              alt={title}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
        </Link>
      )}

      <div className="text-muted-foreground mb-2 flex items-center text-sm">
        <span
          className={`mr-2 inline-block rounded-md px-2 py-1 text-xs ${sourceType === 'hacker-news' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'} `}
        >
          {sourceType === 'hacker-news' ? 'HN' : 'GitHub'}
        </span>
        <time>{formatDate(date)}</time>
      </div>

      <h3 className={`mb-2 font-medium ${featured ? 'text-xl' : 'text-base'}`}>
        <Link href={href} className="hover:text-primary">
          {title}
        </Link>
      </h3>

      {summary && <p className="text-muted-foreground mb-3 line-clamp-3 text-sm">{summary}</p>}

      {tags && tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Tag key={tag} text={tag} small />
          ))}
          {tags.length > 3 && (
            <span className="text-muted-foreground text-xs">+{tags.length - 3}</span>
          )}
        </div>
      )}
    </article>
  )
}
```

### 7. N8N工作流调整

为N8N工作流增加单独文件生成功能:

1. 对Hacker News内容:

   - 为每条HN文章生成唯一ID（基于HN ID或标题）
   - 提取标题、作者、URL等元数据
   - 生成独立MDX文件而非聚合到日期文件

2. 对GitHub Trending内容:
   - 为每个项目生成文件名（基于项目名称）
   - 提取项目描述、URL、星数等信息
   - 单独保存为MDX文件

## 三、实施计划

### 1. 第1周：基础结构与迁移工具

- 编写数据迁移脚本，测试从日期聚合文件到单文件的转换
- 更新Contentlayer配置以支持新的文件格式
- 创建基础组件（NewsItemCard等）

### 2. 第2周：前端页面开发

- 开发看板式主页
- 创建内容详情页
- 开发按来源分类的列表页面
- 重构标签系统

### 3. 第3周：搜索与导航优化

- 实现内容搜索功能
- 添加日期和标签筛选
- 优化导航体验
- 移动适配性优化

### 4. 第4周：N8N工作流修改

- 更新自动内容获取流程，生成单独的文件
- 调整标签生成和内容转换
- 测试完整流程

## 四、优势与结果

1. **内容管理更灵活**：

   - 每篇文章作为独立文件，便于编辑和管理
   - 标签和分类更精确

2. **用户体验提升**：

   - 看板式主页提供更直观的内容概览
   - 细粒度文章便于快速查找和分享

3. **搜索性能优化**：

   - 搜索结果能直接定位到具体文章
   - 改进的标签系统便于内容发现

4. **技术基础更坚实**：
   - 保持现有的Next.js和Contentlayer生态
   - 简化数据模型，减少重复和复杂性
