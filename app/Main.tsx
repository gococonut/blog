import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from '@/utils/formatDate'
import NewsletterForm from 'pliny/ui/NewsletterForm'
import Image from '@/components/Image'
import { cn } from '@/lib/utils'
import ArticleListItem from '@/components/ArticleListItem'

const MAX_DISPLAY = 5

export default function Home({ posts }) {
  return (
    <div className="pt-6 pb-8">
      <h1 className="text-lg leading-9 font-bold text-gray-900 sm:text-xl sm:leading-10 md:text-xl md:leading-14 dark:text-gray-100">
        最新动态
      </h1>
      <div className="space-y-8 pt-6 pb-8">
        {!posts.length && (
          <p className="text-muted-foreground text-center text-sm sm:text-base">没有找到文章。</p>
        )}
        {posts.slice(0, MAX_DISPLAY).map((post) => {
          return <ArticleListItem key={post.slug} post={post} />
        })}
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end">
          <Link
            href="/blog"
            className="text-primary hover:text-primary/80 text-sm transition-colors sm:text-base"
            aria-label="All posts"
          >
            ALL &rarr;
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
