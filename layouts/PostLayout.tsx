'use client'

import { ReactNode } from 'react'
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

  return (
    <SectionContainer>
      <ScrollTopAndComment />
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
