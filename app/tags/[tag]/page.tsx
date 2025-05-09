import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs } from 'contentlayer/generated'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'

const POSTS_PER_PAGE = 5

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tag = decodeURI(params.tag)
  return genPageMetadata({
    title: tag,
    description: `${siteMetadata.title} ${tag} tagged content`,
    alternates: {
      canonical: './',
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/tags/${tag}/feed.xml`,
      },
    },
  })
}

export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  return tagKeys.map((tag) => ({
    tag: encodeURI(tag),
  }))
}

function fullyDecodeURI(uri) {
  let decoded = uri
  let prevDecoded

  do {
    prevDecoded = decoded
    decoded = decodeURI(prevDecoded)
  } while (decoded !== prevDecoded)

  return decoded
}

export default async function TagPage(props: { params: Promise<{ tag: string }> }) {
  const params = await props.params
  const tag = fullyDecodeURI(params.tag)
  const title = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)

  // 修改过滤逻辑，支持从headingSummaries中获取标签
  const filteredPosts = allCoreContent(
    sortPosts(
      allBlogs.filter((post) => {
        // 首先检查顶层tags
        if (post.tags && post.tags.length > 0) {
          return post.tags.map((t) => slug(t)).includes(tag)
        }
        // 如果顶层tags为空但有headingSummaries，则从中查找标签
        else if (post.headingSummaries && post.headingSummaries.length > 0) {
          // 检查任意headingItem中是否包含目标标签
          return post.headingSummaries.some((headingItem) => {
            if (headingItem.tags && Array.isArray(headingItem.tags)) {
              return headingItem.tags.map((t) => slug(t)).includes(tag)
            }
            return false
          })
        }
        return false
      })
    )
  )

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages: totalPages,
  }

  return (
    <ListLayout
      posts={filteredPosts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title={title}
      currentTag={tag}
    />
  )
}
