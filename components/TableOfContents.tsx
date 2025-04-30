import { cn } from '@/lib/utils'

// 更新接口以匹配实际数据结构
export interface Heading {
  value: string
  url: string
  depth: number
}

interface TableOfContentsProps {
  headings: Heading[]
  className?: string
}

export default function TableOfContents({ headings = [], className }: TableOfContentsProps) {
  // 优先查找 level 2 (H2), 使用 'depth'
  let tocHeadings = headings.filter((h) => h.depth === 2)

  // 如果找不到 level 2，则查找 level 3 (H3), 使用 'depth'
  if (tocHeadings.length === 0) {
    tocHeadings = headings.filter((h) => h.depth === 3)
  }

  // 如果 level 2 和 level 3 都找不到，则不渲染目录
  if (tocHeadings.length === 0) {
    return null
  }

  return (
    <nav className={cn('toc', className)} aria-label="Table of contents">
      <ul className="space-y-2">
        {tocHeadings.map((heading) => (
          <li key={heading.url} className="text-sm">
            <a
              href={heading.url}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 dark:hover:text-gray-200"
            >
              {heading.value}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
