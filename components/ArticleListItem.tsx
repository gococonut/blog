import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from '@/utils/formatDate'
import Image from '@/components/Image'
import { cn } from '@/lib/utils'
import type { Blog } from 'contentlayer/generated'

interface ArticleListItemProps {
  post: Omit<Blog, 'body' | '_raw' | '_id'>
}

export default function ArticleListItem({ post }: ArticleListItemProps) {
  const { slug, date, title, summary, tags, cover } = post

  return (
    <article
      key={slug}
      className="group bg-card hover:bg-primary/10 relative flex flex-col space-y-4 rounded-lg border p-6 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl"
    >
      <div className="flex flex-col space-y-4 md:flex-row md:gap-6 md:space-y-0">
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
        <div className={cn('flex flex-col space-y-3', cover ? 'md:w-2/3' : 'w-full')}>
          <h2 className="text-lg font-medium sm:text-xl md:text-xl">
            <Link
              href={`/blog/${slug}`}
              className="text-foreground hover:text-primary transition-colors"
            >
              {title}
            </Link>
          </h2>
          <Link href={`/blog/${slug}`} aria-label={`Read summary and full article: "${title}"`}>
            <div className="prose text-muted-foreground line-clamp-3 max-w-none text-sm font-normal transition-colors duration-200 sm:text-base dark:text-gray-300">
              {summary}
            </div>
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Tag key={tag} text={tag} />
              ))}
            </div>
            <dl className="flex-shrink-0">
              <dt className="sr-only">Published on</dt>
              <dd className="text-sm font-light text-gray-400 dark:text-gray-500">
                <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </article>
  )
}
