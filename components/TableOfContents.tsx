import { cn } from '@/lib/utils'
import Tag from './Tag'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { XIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

// 更新接口以匹配实际数据结构，添加摘要和标签字段
export interface Heading {
  value: string
  url: string
  depth: number
  summary?: string // 摘要字段
  tags?: string[] // 标签字段
}

interface TableOfContentsProps {
  headings: Heading[]
  className?: string
  isMobile?: boolean
  onItemClick?: () => void
  showSummary?: boolean // 控制是否显示摘要的属性
  maxHeight?: string // 控制最大高度的属性
  hideScrollbar?: boolean // 是否隐藏滚动条
  initialSelectedTag?: string // 新增：用于从 URL 初始化选中的标签
}

// 辅助函数：截断摘要文本
const truncateSummary = (text: string, maxLength: number = 120): string => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export default function TableOfContents({
  headings = [],
  className,
  isMobile = false,
  onItemClick,
  showSummary = false,
  maxHeight = '70vh',
  hideScrollbar = true,
  initialSelectedTag,
}: TableOfContentsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTag, setSelectedTag] = useState<string | null>(() => {
    const tagFromUrl = searchParams.get('tag')
    return tagFromUrl || initialSelectedTag || null
  })
  const [showAllTags, setShowAllTags] = useState(false)
  const [userHasInteractedWithHeadings, setUserHasInteractedWithHeadings] = useState(false)

  // 辅助函数，用于根据 URL 查找标题元素
  // 此函数在组件内部定义，因为它不依赖于组件实例的状态或props，
  // 但为了组织结构，放在这里。它也可以被提取到组件外部如果它不访问任何闭包变量。
  const findHeadingElementByUrl = (url: string): Element | null => {
    const trySelector = (selector: string): Element | null => {
      try {
        return document.querySelector(selector)
      } catch {
        return null
      }
    }

    let target = trySelector(url)
    if (target) return target

    if (url.startsWith('#')) {
      const idWithoutHash = url.substring(1)
      if (idWithoutHash) {
        target = document.getElementById(idWithoutHash)
        if (target) return target
        try {
          // CSS.escape 用于安全地创建选择器字符串
          target = document.querySelector(`[id="${CSS.escape(idWithoutHash)}"]`)
          if (target) return target
        } catch {
          // 忽略选择器错误
        }
      }
    }

    const possibleTextContent = url
      .substring(url.startsWith('#') ? 1 : 0)
      .replace(/--/g, ' / ')
      .replace(/-/g, ' ')

    if (possibleTextContent.trim()) {
      const allHeadingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      for (const headingEl of Array.from(allHeadingElements)) {
        if (
          headingEl.textContent &&
          (headingEl.textContent.includes(possibleTextContent) ||
            possibleTextContent.includes(headingEl.textContent))
        ) {
          target = headingEl
          break
        }
      }
    }
    return target
  }

  const scrollToHeading = useCallback(
    (url: string, closeMobileTocOnTrigger?: boolean) => {
      const targetElement = findHeadingElementByUrl(url)

      if (targetElement) {
        const headerOffset = 80
        const elementPosition = targetElement.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' })

        if (isMobile && closeMobileTocOnTrigger && onItemClick) {
          onItemClick()
        }
      }
    },
    [isMobile, onItemClick, findHeadingElementByUrl] // findHeadingElementByUrl 加入依赖，因为它在闭包中被引用
  )

  const tocHeadingsSource = useMemo(() => {
    let base = headings.filter((h) => h.depth === 2)
    if (base.length === 0) {
      base = headings.filter((h) => h.depth === 3)
    }
    return base
  }, [headings])

  const uniqueTags = useMemo(() => {
    const allTagsSet = new Set<string>()
    headings.forEach((heading) => {
      if (heading.tags && heading.tags.length > 0) {
        heading.tags.forEach((tag) => allTagsSet.add(tag))
      }
    })
    return Array.from(allTagsSet).sort()
  }, [headings])

  const filteredHeadings = useMemo(() => {
    if (!selectedTag) return tocHeadingsSource
    return tocHeadingsSource.filter((h) => h.tags && h.tags.includes(selectedTag))
  }, [selectedTag, tocHeadingsSource])

  const displayedTagsLimit = 5
  const tagsToShow = showAllTags ? uniqueTags : uniqueTags.slice(0, displayedTagsLimit)
  const hasMoreTags = uniqueTags.length > displayedTagsLimit

  const handleTagClick = useCallback(
    (tag: string) => {
      const newSelectedTag = selectedTag === tag ? null : tag
      setSelectedTag(newSelectedTag)

      const currentUrl = new URL(window.location.href)
      if (newSelectedTag) {
        currentUrl.searchParams.set('tag', newSelectedTag)
      } else {
        currentUrl.searchParams.delete('tag')
      }
      router.replace(currentUrl.toString(), { scroll: false })

      setUserHasInteractedWithHeadings(false)
      if (uniqueTags.length > displayedTagsLimit) {
        setShowAllTags(false)
      }
    },
    [selectedTag, router, uniqueTags, displayedTagsLimit]
  )

  const clearTagFilter = useCallback(() => {
    setSelectedTag(null)
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('tag')
    router.replace(currentUrl.toString(), { scroll: false })
    setUserHasInteractedWithHeadings(false) // 清除筛选时，允许后续可能的自动滚动（如果逻辑需要）
    // 或者也设为 true，如果清除筛选也不应自动滚动
  }, [router])

  useEffect(() => {
    const canConsiderAutoScroll =
      selectedTag && filteredHeadings.length > 0 && !userHasInteractedWithHeadings

    if (canConsiderAutoScroll) {
      const firstHeadingToScroll = filteredHeadings[0]
      if (firstHeadingToScroll) {
        const scrollDelay = isMobile && initialSelectedTag === selectedTag ? 400 : 100
        const timeoutId = setTimeout(() => {
          scrollToHeading(firstHeadingToScroll.url, false)
        }, scrollDelay)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [
    selectedTag,
    filteredHeadings,
    scrollToHeading,
    isMobile,
    initialSelectedTag,
    userHasInteractedWithHeadings,
  ])

  const scrollbarStyles = hideScrollbar
    ? { msOverflowStyle: 'none' as const, scrollbarWidth: 'none' as const }
    : {}

  return (
    <nav
      className={cn('toc', className, isMobile ? 'mobile-toc' : '')}
      aria-label="Table of contents"
    >
      {uniqueTags.length > 0 && (
        <div className="mb-4">
          <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm font-medium">
            <span>按标签筛选：</span>
            {selectedTag && (
              <button
                onClick={clearTagFilter}
                className="text-muted-foreground hover:text-primary-500 flex items-center text-xs underline"
                aria-label="清除筛选"
              >
                <XIcon className="mr-1 h-3 w-3" />
                清除
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {tagsToShow.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={cn(
                  'focus-visible:ring-ring rounded-sm transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                )}
                aria-pressed={selectedTag === tag}
              >
                <Tag
                  text={tag}
                  asButton={true}
                  isActive={selectedTag === tag}
                  className={cn(
                    selectedTag && selectedTag !== tag ? 'opacity-50 hover:opacity-75' : ''
                  )}
                />
              </button>
            ))}
            {hasMoreTags && (
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="text-muted-foreground hover:text-primary-500 ml-1 flex items-center text-xs underline"
                aria-expanded={showAllTags}
              >
                {showAllTags ? (
                  <>
                    收起 <ChevronUpIcon className="ml-1 h-3 w-3" />
                  </>
                ) : (
                  <>
                    更多 ({uniqueTags.length - displayedTagsLimit}){' '}
                    <ChevronDownIcon className="ml-1 h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className={cn(
          'overflow-y-auto pr-2',
          !isMobile && 'overflow-auto',
          hideScrollbar && 'webkit-scrollbar-hide'
        )}
        style={{
          ...(!isMobile ? { maxHeight } : {}),
          ...scrollbarStyles,
        }}
      >
        {filteredHeadings.length > 0 ? (
          <ul className={cn(showSummary ? 'space-y-6' : 'space-y-2')}>
            {filteredHeadings.map((heading) => (
              <li
                key={heading.url}
                className={cn(
                  'text-sm',
                  showSummary && heading.summary
                    ? 'mb-1 border-b border-gray-100 pb-4 dark:border-gray-800'
                    : 'pb-2'
                )}
              >
                <a
                  href={heading.url}
                  className="text-foreground/75 hover:text-primary-500 dark:hover:text-primary-400 font-medium transition-colors duration-200"
                  onClick={(e) => {
                    e.preventDefault()
                    setUserHasInteractedWithHeadings(true)
                    scrollToHeading(heading.url, true)
                  }}
                >
                  {heading.value}
                </a>

                {showSummary && heading.summary && (
                  <div className="mt-2 space-y-1">
                    <button
                      type="button"
                      className="group w-full text-left"
                      onClick={() => {
                        setUserHasInteractedWithHeadings(true)
                        scrollToHeading(heading.url, true)
                      }}
                      aria-label={`跳转到"${heading.value}"章节`}
                    >
                      <p className="text-muted-foreground/80 hover:text-muted-foreground line-clamp-3 cursor-pointer text-xs transition-colors duration-200">
                        {truncateSummary(heading.summary)}
                      </p>
                    </button>

                    {heading.tags && heading.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {heading.tags.map((tagText, index) => {
                          const isActiveTag = selectedTag === tagText
                          return (
                            <Tag
                              key={`${heading.url}-tag-${index}`}
                              text={tagText}
                              asButton={true}
                              isActive={isActiveTag}
                              className={cn(
                                'bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent',
                                isActiveTag
                                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                                  : selectedTag
                                    ? 'opacity-50'
                                    : ''
                              )}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            {selectedTag ? `没有找到与 "${selectedTag}"相关的目录项` : '没有目录项'}
          </p>
        )}
      </div>
    </nav>
  )
}
