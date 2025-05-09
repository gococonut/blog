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

  // 将 scrollToHeading 移至 useEffect 依赖项之前，并用 useCallback 包裹
  const scrollToHeading = useCallback(
    (url: string, closeMobileTocOnTrigger?: boolean) => {
      // 安全地尝试使用选择器
      const trySelector = (selector: string) => {
        try {
          return document.querySelector(selector)
        } catch (error) {
          return null
        }
      }

      // 1. 尝试直接使用 URL 作为选择器
      let target = trySelector(url)

      // 2. 如果URL以#开头，尝试使用去掉#的方式查找元素
      if (!target && url.startsWith('#')) {
        const idWithoutHash = url.substring(1)
        target = document.getElementById(idWithoutHash)

        // 3. 如果ID以数字开头，这可能是选择器错误的原因
        if (!target && /^\d/.test(idWithoutHash)) {
          // 使用属性选择器而不是ID选择器
          target = trySelector(`[id="${idWithoutHash}"]`)
        }
      }

      // 4. 尝试查找包含特定文本的标题
      if (!target) {
        // 从URL推测可能的标题文本
        const possibleText = url
          .substring(1) // 移除#
          .replace(/--/g, ' / ') // 将双横线替换回斜杠
          .replace(/-/g, ' ') // 将单横线替换为空格

        // 查找所有标题元素
        const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')

        allHeadings.forEach((heading) => {
          if (
            heading.textContent &&
            (heading.textContent.includes(possibleText) ||
              possibleText.includes(heading.textContent))
          ) {
            target = heading
          }
        })
      }

      if (target) {
        const headerOffset = 80 // 保持此偏移量，以便标题不会被固定页眉遮挡
        const elementPosition = target.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
        if (isMobile && closeMobileTocOnTrigger) {
          onItemClick?.()
        }
      }
    },
    [isMobile, onItemClick] // 依赖项
  )

  // 使用 useMemo 优化派生状态的计算
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
      // 从原始 headings 提取，保证筛选器总有所有标签
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

  const displayedTagsLimit = 5 // 初始显示的标签数量
  const tagsToShow = showAllTags ? uniqueTags : uniqueTags.slice(0, displayedTagsLimit)
  const hasMoreTags = uniqueTags.length > displayedTagsLimit

  // 将 handleTagClick 和 clearTagFilter 的定义移到依赖项声明之后
  const handleTagClick = useCallback(
    (tag: string) => {
      const newSelectedTag = selectedTag === tag ? null : tag
      setSelectedTag(newSelectedTag)

      // 更新 URL
      const currentUrl = new URL(window.location.href)
      if (newSelectedTag) {
        currentUrl.searchParams.set('tag', newSelectedTag)
      } else {
        currentUrl.searchParams.delete('tag')
      }
      router.replace(currentUrl.toString(), { scroll: false }) // 使用 replace 避免增加浏览器历史记录，scroll: false 避免页面滚动

      setUserHasInteractedWithHeadings(false)
      if (uniqueTags.length > displayedTagsLimit) {
        setShowAllTags(false)
      }
    },
    [selectedTag, router, uniqueTags, displayedTagsLimit] // 添加 router 到依赖
  )

  const clearTagFilter = useCallback(() => {
    setSelectedTag(null)
    // 更新 URL
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('tag')
    router.replace(currentUrl.toString(), { scroll: false })

    setUserHasInteractedWithHeadings(false)
  }, [router]) // 添加 router 到依赖

  // 初始滚动逻辑的 useEffect
  useEffect(() => {
    if (selectedTag && filteredHeadings.length > 0 && !userHasInteractedWithHeadings) {
      const firstHeadingToScroll = filteredHeadings[0]
      if (firstHeadingToScroll) {
        const timeoutId = setTimeout(
          () => {
            scrollToHeading(firstHeadingToScroll.url, false)
          },
          isMobile && initialSelectedTag === selectedTag ? 400 : 100
        )
        return () => clearTimeout(timeoutId)
      }
    }
  }, [
    selectedTag,
    filteredHeadings,
    scrollToHeading,
    isMobile,
    initialSelectedTag,
    userHasInteractedWithHeadings, // Add new state to dependency array
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
                    setUserHasInteractedWithHeadings(true) // User clicked a specific heading
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
                        setUserHasInteractedWithHeadings(true) // User clicked a specific heading via summary
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
                              asButton={true} // Ensures it doesn't behave like a link, base text color from Tag.tsx if not overridden
                              isActive={isActiveTag}
                              className={cn(
                                // Common for Type 3 Heading Tags: always transparent background & no hover background effect.
                                'bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent',
                                isActiveTag
                                  ? // Active Type 3 Tag: Use a distinct, brighter text color and font weight.
                                    'text-primary-600 dark:text-primary-400 font-semibold'
                                  : // Inactive Type 3 Tag (when a filter is selected elsewhere):
                                    // Apply opacity. Default text color comes from Tag.tsx's non-active button style.
                                    selectedTag
                                    ? 'opacity-50'
                                    : '' // No specific style if no filter is active and tag is not active.
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
