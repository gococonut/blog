'use client'

import { ReactNode, useState, useEffect, useRef, Fragment } from 'react'
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
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'
import { ListOrdered } from 'lucide-react'

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
  content: CoreContent<Blog>
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
  const { filePath, path, slug, date, title, tags } = content
  const basePath = path.split('/')[0]
  const [isTocPanelOpen, setIsTocPanelOpen] = useState(false)
  const tocPanelRef = useRef(null)

  const onToggleTocPanel = () => {
    setIsTocPanelOpen((status) => {
      const targetElement = tocPanelRef.current
      if (targetElement) {
        if (status) {
          enableBodyScroll(targetElement)
        } else {
          disableBodyScroll(targetElement, { reserveScrollBarGap: true })
        }
      }
      return !status
    })
  }

  useEffect(() => {
    return () => {
      clearAllBodyScrollLocks()
    }
  }, [])

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      {/* Mobile TOC Trigger Button (fixed, bottom-right, <lg only) */}
      {headings && headings.length > 0 && (
        <>
          <div className="fixed right-8 bottom-8 z-50 lg:hidden">
            <button
              aria-label="打开目录"
              onClick={onToggleTocPanel}
              className="rounded-full bg-gray-100/50 p-2.5 text-gray-400 shadow-none backdrop-blur-sm transition-colors hover:bg-gray-200/50 dark:bg-gray-900/50 dark:text-gray-500 dark:hover:bg-gray-800/50"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>
          <Transition appear show={isTocPanelOpen} as={Fragment}>
            <Dialog as="div" className="fixed inset-0 z-[60] lg:hidden" onClose={onToggleTocPanel}>
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm dark:bg-black/50" />
              </TransitionChild>
              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <DialogPanel
                      ref={tocPanelRef}
                      className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-900"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                          目录
                        </h3>
                        <button
                          onClick={onToggleTocPanel}
                          className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-4">
                        <TableOfContents headings={headings} onItemClick={onToggleTocPanel} />
                      </div>
                    </DialogPanel>
                  </TransitionChild>
                </div>
              </div>
            </Dialog>
          </Transition>
        </>
      )}
      <article>
        <div>
          <header className="pt-6 pb-6">
            <div className="space-y-4">
              <div>
                <PageTitle>{title}</PageTitle>
              </div>
              <dl className="space-y-1">
                <dt className="sr-only">发布于</dt>
                <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                  <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                </dd>
              </dl>
              {tags && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Tag key={tag} text={tag} />
                  ))}
                </div>
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
                <TableOfContents headings={headings} />
              </div>
            </aside>
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
