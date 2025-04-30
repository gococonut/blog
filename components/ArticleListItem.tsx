import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from '@/utils/formatDate'
import { cn } from '@/lib/utils'
import type { Blog } from 'contentlayer/generated'
import Image from '@/components/Image'

interface ArticleListItemProps {
  post: Omit<Blog, 'body' | '_raw' | '_id'>
}

export default function ArticleListItem({ post }: ArticleListItemProps) {
  const { slug, date, title, summary, tags, cover } = post

  return (
    <article
      key={slug}
      className="group bg-card relative flex flex-col space-y-3 rounded-lg border p-3 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl sm:space-y-4 sm:p-6"
    >
      <div className="flex flex-col space-y-3 md:flex-row md:gap-6 md:space-y-0">
        {cover && (
          <div className="flex-shrink-0 md:w-1/3">
            <Link href={`/blog/${slug}`} aria-label={`Read more: "${title}"`}>
              <Image
                src={cover}
                alt={title}
                width={400}
                height={225}
                className="rounded-md object-cover object-center transition-transform"
              />
            </Link>
          </div>
        )}
        <div className="flex flex-1 flex-col justify-between">
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-base font-medium sm:text-lg md:text-xl">
              <Link
                href={`/blog/${slug}`}
                className="text-foreground hover:text-primary transition-colors"
              >
                {title}
              </Link>
            </h2>
            <Link href={`/blog/${slug}`} aria-label={`Read summary and full article: "${title}"`}>
              <div className="prose line-clamp-2 max-w-none text-sm font-normal transition-colors duration-200 dark:text-gray-300">
                {summary}
              </div>
            </Link>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Tag key={tag} text={tag} />
              ))}
            </div>
            <dl className="flex-shrink-0">
              <dt className="sr-only">Published on</dt>
              <dd className="text-muted-foreground text-xs font-light sm:text-sm dark:text-gray-500">
                <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </article>
  )
}
