import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from '@/utils/formatDate'
import NewsletterForm from 'pliny/ui/NewsletterForm'
import Image from '@/components/Image'
import { cn } from '@/lib/utils'

const MAX_DISPLAY = 5

export default function Home({ posts }) {
  return (
    <div className="space-y-8 pt-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">最新动态</h1>
        <p className="text-muted-foreground text-base sm:text-lg">{siteMetadata.description}</p>
      </div>
      <div className="space-y-8">
        {!posts.length && (
          <p className="text-muted-foreground text-center text-sm sm:text-base">没有找到文章。</p>
        )}
        {posts.slice(0, MAX_DISPLAY).map((post) => {
          const { slug, date, title, summary, tags, cover } = post
          return (
            <article
              key={slug}
              className="group bg-card hover:bg-muted/50 relative flex flex-col space-y-4 rounded-lg border p-6 transition-colors"
            >
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6">
                {cover && (
                  <div className="flex-shrink-0 md:w-1/3">
                    <Link href={`/blog/${slug}`} aria-label={`Read more: "${title}"`}>
                      <Image
                        src={cover}
                        alt={title}
                        width={400}
                        height={225}
                        className="rounded-md object-cover object-center transition-transform group-hover:scale-[1.02]"
                      />
                    </Link>
                  </div>
                )}
                <div className={cn('space-y-4', cover ? 'md:w-2/3' : 'w-full')}>
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                        <Link
                          href={`/blog/${slug}`}
                          className="text-foreground hover:text-primary transition-colors"
                        >
                          {title}
                        </Link>
                      </h2>
                      <dl>
                        <dt className="sr-only">Published on</dt>
                        <dd className="text-muted-foreground mt-1 mb-2 text-sm font-medium sm:text-base">
                          <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                        </dd>
                      </dl>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Tag key={tag} text={tag} />
                        ))}
                      </div>
                    </div>
                    <div className="prose text-muted-foreground max-w-none text-sm sm:text-base">
                      {summary}
                    </div>
                  </div>
                  <div className="text-sm font-medium sm:text-base">
                    <Link
                      href={`/blog/${slug}`}
                      className="text-primary hover:text-primary/80 transition-colors"
                      aria-label={`Read more: "${title}"`}
                    >
                      更多 &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end">
          <Link
            href="/blog"
            className="text-primary hover:text-primary/80 text-sm transition-colors sm:text-base"
            aria-label="All posts"
          >
            所有文章 &rarr;
          </Link>
        </div>
      )}
      {siteMetadata.newsletter?.provider && (
        <div className="flex items-center justify-center pt-4">
          <NewsletterForm />
        </div>
      )}
    </div>
  )
}
