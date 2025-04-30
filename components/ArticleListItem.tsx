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
      className="group bg-card relative flex flex-col space-y-3 rounded-lg border p-3 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:flex-row md:space-y-0 md:space-x-6 md:p-6"
    >
      {cover && (
        <div className="hidden flex-shrink-0 md:block md:w-1/3">
          <Link href={`/blog/${slug}`} aria-label={`Read more: "${title}"`}>
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
                href={`/blog/${slug}`}
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
          <Link href={`/blog/${slug}`} aria-label={`Read summary: "${title}"`}>
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
            {tags.map((tag) => (
              <Tag key={tag} text={tag} />
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
