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
  isMobile?: boolean
  onItemClick?: () => void
}

export default function TableOfContents({
  headings = [],
  className,
  isMobile = false,
  onItemClick,
}: TableOfContentsProps) {
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

  const scrollToHeading = (url: string) => {
    const target = document.querySelector(url)
    if (target) {
      const headerOffset = 100 // 顶部导航栏的高度 + 一些额外间距
      const elementPosition = target.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })

      // 如果是移动端，点击后关闭目录
      if (isMobile) {
        onItemClick?.()
      }
    }
  }

  return (
    <nav
      className={cn(
        'toc',
        className,
        isMobile ? 'mobile-toc' : ''
      )}
      aria-label="Table of contents"
    >
      <ul className="space-y-2">
        {tocHeadings.map((heading) => (
          <li key={heading.url} className="text-sm">
            <a
              href={heading.url}
              className="text-muted-foreground hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200"
              onClick={(e) => {
                e.preventDefault()
                scrollToHeading(heading.url)
              }}
            >
              {heading.value}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
