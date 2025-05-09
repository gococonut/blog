import Link from 'next/link'
import { slug } from 'github-slugger'
import { cn } from '@/lib/utils'

interface TagProps {
  text: string
  className?: string
  title?: string
  children?: React.ReactNode
  asButton?: boolean
  isActive?: boolean
}

const Tag = ({
  text,
  className = '',
  title,
  children,
  asButton = false,
  isActive = false,
}: TagProps) => {
  const baseStyles =
    'inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs transition-colors duration-200'

  // 激活状态的核心样式 (背景和文字) - 使用了更深的颜色
  const activeCoreStyles =
    'bg-primary-600 text-primary-foreground hover:bg-primary-500 dark:bg-primary-500 dark:text-primary-foreground dark:hover:bg-primary-400'
  // 激活状态的阴影 (仅链接激活时使用)
  const activeShadowStyles = 'shadow-sm'

  // 非激活状态下链接和可点击按钮的样式
  const interactiveNonActiveCoreStyles =
    'bg-primary-100/50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-300'
  const interactiveNonActiveHoverStyles = 'hover:bg-primary-200/60 dark:hover:bg-primary-800/40'

  let combinedClassName

  if (isActive) {
    if (asButton) {
      // 类型2和类型3的激活状态: 深色背景，无阴影
      combinedClassName = cn(baseStyles, activeCoreStyles, className)
    } else {
      // 类型1的激活状态: 深色背景 + 阴影
      combinedClassName = cn(baseStyles, activeCoreStyles, activeShadowStyles, className)
    }
  } else {
    // 非激活状态
    if (asButton) {
      // 类型2的非激活状态: 与链接非激活态相似，有背景和hover，使其可点击
      // 类型3的非激活状态如果希望无背景，需要外部通过className覆盖背景和hover背景
      combinedClassName = cn(
        baseStyles,
        interactiveNonActiveCoreStyles,
        interactiveNonActiveHoverStyles,
        className
      )
    } else {
      // 类型1的非激活状态:
      combinedClassName = cn(
        baseStyles,
        interactiveNonActiveCoreStyles,
        interactiveNonActiveHoverStyles,
        'cursor-pointer',
        className
      )
    }
  }

  if (asButton) {
    return (
      <span className={combinedClassName} title={title}>
        {children || text}
      </span>
    )
  }

  const href = `/tags/${slug(text)}`
  return (
    <Link href={href} className={combinedClassName} title={title}>
      {children || text}
    </Link>
  )
}

export default Tag
