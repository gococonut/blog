import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from '@/data/logo.svg'
import Link from '@/components/Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import SearchButton from './SearchButton'
import { cn } from '@/lib/utils'

const Header = () => {
  return (
    <header
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur',
        siteMetadata.stickyNav ? 'sticky' : 'relative'
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-6 w-6" />
            <span className="text-xl font-bold sm:text-2xl">字节篝火</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <nav className="hidden items-center space-x-6 text-sm font-light md:flex">
            {headerNavLinks
              .filter((link) => link.href !== '/')
              .map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="hover:text-primary-600 dark:hover:text-primary-400 text-base font-semibold transition-colors"
                >
                  {link.title}
                </Link>
              ))}
          </nav>
          <SearchButton />
          <ThemeSwitch />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

export default Header
