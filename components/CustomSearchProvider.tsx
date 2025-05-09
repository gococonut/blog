'use client'

import { KBarSearchProvider } from 'pliny/search/KBar'
import { useRouter } from 'next/navigation'
import { SearchConfig } from 'pliny/search'
import { slug } from 'github-slugger'
import Tag from '@/components/Tag'

interface SearchDocument {
  objectID: string
  title: string
  date: string
  summary?: string
  tags?: string[]
  kind: string
  path: string
}

// 辅助函数：截断摘要文本
const truncateSummary = (text: string, maxLength: number = 80): string => {
  if (!text || text.length <= maxLength) return text
  // 在合适的位置截断，避免单词被截断
  const lastSpace = text.substring(0, maxLength).lastIndexOf(' ')
  const endPos = lastSpace > maxLength * 0.8 ? lastSpace : maxLength
  return text.substring(0, endPos) + '...'
}

export const CustomSearchProvider = ({
  children,
  searchConfig,
}: {
  children: React.ReactNode
  searchConfig: SearchConfig
}) => {
  const router = useRouter()

  // 确保使用 kbar 搜索提供者
  if (searchConfig.provider !== 'kbar') {
    throw new Error('CustomSearchProvider 只支持 kbar 搜索提供者')
  }

  return (
    <KBarSearchProvider
      kbarConfig={{
        searchDocumentsPath: searchConfig.kbarConfig.searchDocumentsPath,
        onSearchDocumentsLoad(json) {
          return json.map((doc: SearchDocument) => {
            // 准备搜索关键词 - 合并所有可搜索内容
            // 1. 标题始终是最重要的关键词
            let keywords = doc.title

            // 2. 添加摘要作为关键词 (如果有)
            if (doc.summary) {
              keywords += ' ' + doc.summary
            }

            // 3. 添加标签作为关键词 (如果有)
            if (doc.tags && doc.tags.length > 0) {
              keywords += ' ' + doc.tags.join(' ')
            }

            // 4. 格式化日期作为副标题的一部分
            const date = new Date(doc.date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })

            // 5. 构建摘要显示
            let subtitle = date
            if (doc.summary) {
              subtitle += ` · ${truncateSummary(doc.summary)}`
            }

            // 6. 创建标签元素的JSX字符串表示 (会在KBar中被解析为HTML)
            const tagsDisplay =
              doc.tags && doc.tags.length > 0
                ? `<div class="flex flex-wrap gap-1 mt-1">
                  ${doc.tags
                    .map(
                      (tag) =>
                        `<span class="bg-primary-100/50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-300 inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs">${tag}</span>`
                    )
                    .join('')}
                </div>`
                : ''

            return {
              id: doc.objectID || doc.path,
              name: doc.title,
              keywords: keywords,
              subtitle: subtitle,
              // 添加HTML标签元素到摘要之后
              extraHTML: tagsDisplay,
              perform: () => {
                // 确保路径是绝对路径，如果不是则添加斜杠前缀
                const absolutePath = doc.path.startsWith('/') ? doc.path : `/${doc.path}`
                router.push(absolutePath)
              },
            }
          })
        },
      }}
    >
      {children}
    </KBarSearchProvider>
  )
}
