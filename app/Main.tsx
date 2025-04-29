import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from '@/utils/formatDate'
import NewsletterForm from 'pliny/ui/NewsletterForm'
import Image from '@/components/Image'

const MAX_DISPLAY = 5

export default function Home({ posts }) {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-2xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-3xl sm:leading-10 md:text-4xl md:leading-14 dark:text-gray-100">
            最新动态
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            {siteMetadata.description}
          </p>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && '没有找到文章。'}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
            const { slug, date, title, summary, tags, cover } = post
            return (
              <li key={slug} className="py-12">
                <article>
                  <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6">
                    {cover && (
                      <div className="flex-shrink-0 md:w-1/3">
                        <Link href={`/blog/${slug}`} aria-label={`Read more: "${title}"`}>
                          <Image
                            src={cover}
                            alt={title}
                            width={400}
                            height={225}
                            className="rounded-md object-cover object-center"
                          />
                        </Link>
                      </div>
                    )}
                    <div className={`space-y-4 ${cover ? 'md:w-2/3' : 'w-full'}`}>
                      <div className="space-y-3">
                        <div>
                          <h2 className="text-2xl leading-8 font-bold tracking-tight">
                            <Link
                              href={`/blog/${slug}`}
                              className="text-gray-900 dark:text-gray-100"
                            >
                              {title}
                            </Link>
                          </h2>
                          <dl>
                            <dt className="sr-only">Published on</dt>
                            <dd className="mt-1 mb-2 text-sm leading-6 font-medium text-gray-500 dark:text-gray-400">
                              <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                            </dd>
                          </dl>
                          <div className="flex flex-wrap">
                            {tags.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                      <div className="text-base leading-6 font-medium">
                        <Link
                          href={`/blog/${slug}`}
                          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                          aria-label={`Read more: "${title}"`}
                        >
                          更多 &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base leading-6 font-medium">
          <Link
            href="/blog"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
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
    </>
  )
}
