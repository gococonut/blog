import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function PageTitle({ children }: Props) {
  return (
    <h1 className="text-2xl leading-8 font-extrabold text-gray-900 sm:text-3xl sm:leading-9 md:text-4xl md:leading-10 dark:text-gray-100">
      {children}
    </h1>
  )
}
