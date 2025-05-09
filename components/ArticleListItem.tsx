import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from '@/utils/formatDate'
import { cn } from '@/lib/utils'
import type { Blog } from 'contentlayer/generated'
import Image from '@/components/Image'
import React from 'react'

interface ArticleListItemProps {
  post: Omit<Blog, 'body' | '_raw' | '_id'>
  currentTag?: string
}

export default function ArticleListItem({ post, currentTag }: ArticleListItemProps) {
  const { slug, date, title, summary, tags, headingSummaries, cover } = post

  // 获取要显示的标签
  const displayTags = React.useMemo(() => {
    // 如果有顶层tags且不为空，直接使用
    if (tags && tags.length > 0) {
      return tags.map((tag) => ({
        name: tag,
        count: 1,
        displayText: tag,
      }))
    }

    // 如果没有顶层标签但有headingSummaries，从中收集标签并统计次数
    if (headingSummaries && headingSummaries.length > 0) {
      // 统计所有标签的出现次数
      const tagCounts: Record<string, number> = {}
      headingSummaries.forEach((item) => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((tag) => {
            if (tag in tagCounts) {
              tagCounts[tag] += 1
            } else {
              tagCounts[tag] = 1
            }
          })
        }
      })

      // 生成带计数的标签列表
      return Object.entries(tagCounts)
        .map(([tag, count]) => ({
          name: tag, // 原始标签名(用于搜索)
          count: count, // 出现次数
          displayText: count > 1 ? `${tag}(${count})` : tag, // 显示文本
        }))
        .sort((a, b) => b.count - a.count) // 按 count 降序排列
    }

    // 默认返回空数组
    return []
  }, [tags, headingSummaries])

  return (
    <article
      key={slug}
      className="group bg-card relative flex flex-col space-y-3 rounded-lg border p-3 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:flex-row md:space-y-0 md:space-x-6 md:p-6"
    >
      {cover && (
        <div className="hidden flex-shrink-0 md:block md:w-1/3">
          <Link
            href={currentTag ? `/blog/${slug}?tag=${currentTag}` : `/blog/${slug}`}
            aria-label={`Read more: "${title}"`}
          >
            <Image
              src={cover}
              alt={title}
              width={400}
              height={225}
              className="rounded-md object-cover object-center transition-transform group-hover:scale-105"
            />
          </Link>
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-3 md:space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="flex-grow text-base font-medium sm:text-lg md:text-xl">
              <Link
                href={currentTag ? `/blog/${slug}?tag=${currentTag}` : `/blog/${slug}`}
                className="text-foreground hover:text-primary transition-colors"
              >
                {title}
              </Link>
            </h2>
            <dl className="flex-shrink-0">
              <dt className="sr-only">Published on</dt>
              <dd className="text-muted-foreground text-xs font-light whitespace-nowrap sm:text-sm">
                <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
              </dd>
            </dl>
          </div>
          <Link
            href={currentTag ? `/blog/${slug}?tag=${currentTag}` : `/blog/${slug}`}
            aria-label={`Read summary: "${title}"`}
          >
            <div
              className={cn(
                'prose dark:prose-invert max-w-none text-sm font-normal',
                'leading-relaxed md:leading-normal',
                'line-clamp-5 md:line-clamp-4'
              )}
            >
              {summary}
            </div>
          </Link>
        </div>
        <div className="pt-3">
          <div className="flex flex-wrap gap-1">
            {displayTags.map((tagInfo) => (
              <Tag key={tagInfo.name} text={tagInfo.name}>
                {tagInfo.displayText}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
