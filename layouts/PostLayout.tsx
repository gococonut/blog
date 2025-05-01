'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import Image from '@/components/Image'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import { formatDate } from '@/utils/formatDate'
import TableOfContents, { Heading } from '@/components/TableOfContents'
import { ListOrdered, X } from 'lucide-react'
import { animate, createScope, Scope, stagger } from 'animejs'

const editUrl = (path) => `${siteMetadata.siteRepo}/blob/main/data/${path}`
const discussUrl = (path) =>
  `https://mobile.twitter.com/search?q=${encodeURIComponent(`${siteMetadata.siteUrl}/${path}`)}`

const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

interface LayoutProps {
  content: CoreContent<Blog> & { summary?: string }
  authorDetails: CoreContent<Authors>[]
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  children: ReactNode
  headings: Heading[]
}

export default function PostLayout({
  content,
  authorDetails,
  next,
  prev,
  children,
  headings,
}: LayoutProps) {
  const { filePath, path, slug, date, title, tags, summary } = content
  const basePath = path.split('/')[0]
  const [isTocOpen, setIsTocOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const scope = useRef<Scope | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const tocContentRef = useRef<HTMLDivElement>(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [scrollingDown, setScrollingDown] = useState(false)
  const lastScrollY = useRef(0)

  // Handle scroll direction detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY.current) {
        setScrollingDown(true)
      } else {
        setScrollingDown(false)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (root.current) {
      scope.current = createScope({ root: root.current }).add((self) => {
        // 创建目录面板的动画
        self.add('toggleToc', (isOpen: boolean) => {
          if (buttonRef.current && panelRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect()

            if (isOpen) {
              // 设置初始状态
              if (panelRef.current) {
                panelRef.current.style.transformOrigin = 'bottom right'
              }

              // 主面板动画
              animate('.toc-panel', {
                translateY: ['100%', '0%'],
                opacity: [0, 1],
                duration: 650,
                easing: 'cubicBezier(0.16, 1, 0.3, 1)', // 自定义缓动函数，更流畅
              })

              // 隐藏TOC按钮
              animate(buttonRef.current, {
                scale: [1, 0],
                opacity: [1, 0],
                duration: 300,
                easing: 'easeOutQuad',
              })

              // 内容元素的级联动画
              animate('.mobile-toc li', {
                translateY: ['20px', '0px'],
                opacity: [0, 1],
                delay: stagger(50, { start: 200 }), // 级联延迟
                duration: 500,
                easing: 'easeOutQuint',
              })

              // 目录标题和关闭按钮的动画
              animate('.toc-header', {
                translateY: ['-10px', '0px'],
                opacity: [0, 1],
                duration: 400,
                easing: 'easeOutQuad',
                delay: 100,
              })
            } else {
              // 关闭动画
              animate('.toc-panel', {
                translateY: ['0%', '100%'],
                opacity: [1, 0],
                duration: 550,
                easing: 'cubicBezier(0.7, 0, 0.84, 0)', // 自定义缓动函数
              })

              // 显示TOC按钮
              animate(buttonRef.current, {
                scale: [0, 1],
                opacity: [0, 1],
                duration: 300,
                delay: 300,
                easing: 'easeOutBack',
              })

              // 内容元素快速淡出
              animate('.mobile-toc li', {
                opacity: 0,
                duration: 200,
                easing: 'easeOutQuad',
              })
            }
          }
        })

        // 创建按钮进场动画 - 完全与关闭目录时一致
        self.add('buttonEntrance', () => {
          if (buttonRef.current) {
            // 设置初始状态 - 完全透明
            buttonRef.current.style.opacity = '0'
            buttonRef.current.style.transform = 'scale(0)'

            // 完全匹配关闭目录时按钮的动画
            setTimeout(() => {
              animate(buttonRef.current as Element, {
                scale: [0, 1],
                opacity: [0, 0.9],
                duration: 300,
                easing: 'easeOutBack',
              })
            }, 600)
          }
        })
      })

      // 设置初始状态为关闭
      if (panelRef.current) {
        panelRef.current.style.opacity = '0'
        panelRef.current.style.transform = 'translateY(100%)'
      }
    }

    return () => {
      if (scope.current) {
        scope.current.revert()
      }
    }
  }, [])

  // 页面加载时执行按钮动画
  useEffect(() => {
    // 修改滚动方向状态，确保初始加载时不会应用滚动状态
    const initialScrollY = window.scrollY
    lastScrollY.current = initialScrollY
    setScrollingDown(false)

    if (scope.current && !isPageLoaded && headings && headings.length > 0) {
      setTimeout(() => {
        if (scope.current) {
          scope.current.methods.buttonEntrance()
          setIsPageLoaded(true)
        }
      }, 300) // 页面加载后短暂延迟再执行动画
    }
  }, [isPageLoaded, headings])

  // 监听点击外部关闭目录
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isTocOpen &&
        tocContentRef.current &&
        !tocContentRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsTocOpen(false)
        if (scope.current) {
          scope.current.methods.toggleToc(false)
        }
      }
    }

    if (isTocOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isTocOpen])

  const handleToggleToc = () => {
    setIsTocOpen((prev) => {
      const newState = !prev
      if (scope.current) {
        scope.current.methods.toggleToc(newState)
      }
      return newState
    })
  }

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      {/* Mobile TOC Button and Panel */}
      {headings && headings.length > 0 && (
        <div ref={root}>
          {/* TOC Button */}
          <button
            ref={buttonRef}
            onClick={handleToggleToc}
            className="bg-primary-400/70 hover:bg-primary-500 dark:bg-primary-500/70 dark:hover:bg-primary-400 fixed right-6 bottom-6 z-50 rounded-full p-3 text-white shadow-lg transition-all duration-300 lg:hidden"
            aria-label={isTocOpen ? '关闭目录' : '打开目录'}
            style={{
              opacity: 0, // 初始状态为完全透明
              transform: 'scale(0)', // 初始状态为缩小
              ...(isPageLoaded && {
                opacity: scrollingDown ? 0.3 : 0.7,
                transform: 'scale(1)',
              }),
            }}
          >
            <ListOrdered className="h-5 w-5" />
          </button>

          {/* TOC Panel */}
          <div
            ref={panelRef}
            className="toc-panel bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed right-0 bottom-0 left-0 z-40 border-t shadow-lg backdrop-blur lg:hidden"
            style={{ opacity: 0, transform: 'translateY(100%)' }}
          >
            <div ref={tocContentRef} className="container max-h-[50vh] overflow-y-auto p-4">
              <div className="toc-header mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">目录</h3>
                <button
                  onClick={handleToggleToc}
                  className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 p-2 transition-colors"
                  aria-label="关闭目录"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <TableOfContents
                headings={headings}
                isMobile={true}
                onItemClick={handleToggleToc}
                className="mobile-toc"
              />
            </div>
          </div>
        </div>
      )}
      <article>
        <div>
          <header className="pt-6 pb-6">
            <div className="space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex-grow">
                  <PageTitle>{title}</PageTitle>
                </div>
                <dl className="flex-shrink-0">
                  <dt className="sr-only">发布于</dt>
                  <dd className="text-base leading-6 font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                    <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                  </dd>
                </dl>
              </div>
              {tags && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Tag key={tag} text={tag} />
                  ))}
                </div>
              )}
              {summary && (
                <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                  {summary}
                </p>
              )}
            </div>
          </header>
          <div className="divide-y divide-gray-200 pb-8 lg:grid lg:grid-cols-4 lg:gap-x-12 dark:divide-gray-700">
            <div className="divide-y divide-gray-200 lg:col-span-3 dark:divide-gray-700">
              <div className="prose dark:prose-invert max-w-none pt-4 pb-8">{children}</div>
              {siteMetadata.comments && (
                <div
                  className="pt-6 pb-6 text-center text-gray-700 dark:text-gray-300"
                  id="comment"
                >
                  <Comments slug={slug} />
                </div>
              )}
              <footer>
                <div className="divide-y divide-gray-200 text-sm leading-5 font-medium dark:divide-gray-700">
                  {(next || prev) && (
                    <div className="flex flex-col justify-between gap-4 py-4 sm:flex-row">
                      {prev && prev.path && (
                        <div className="text-left">
                          <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                            上一篇
                          </h2>
                          <div className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                            <Link href={`/${prev.path}`}>{prev.title}</Link>
                          </div>
                        </div>
                      )}
                      {next && next.path && (
                        <div className="text-right">
                          <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                            下一篇
                          </h2>
                          <div className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                            <Link href={`/${next.path}`}>{next.title}</Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="pt-4">
                    <Link
                      href={`/${basePath}`}
                      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                      aria-label="返回博客"
                    >
                      &larr; 返回博客
                    </Link>
                  </div>
                </div>
              </footer>
            </div>
            <aside className="hidden lg:col-span-1 lg:block">
              <div className="lg:sticky lg:top-24">
                <h2 className="mb-4 text-lg font-semibold">目录</h2>
                <TableOfContents headings={headings} isMobile={false} />
              </div>
            </aside>
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
