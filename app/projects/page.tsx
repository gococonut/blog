import projectsData from '@/data/projectsData'
import Card from '@/components/Card'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-lg leading-9 font-bold text-gray-900 sm:text-xl sm:leading-10 md:text-xl md:leading-14 dark:text-gray-100">
            项目展示
          </h1>
          {/* <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            使用横幅图片（16 x 9）展示您的项目
          </p> */}
        </div>
        <div className="container py-12">
          <div className="-m-4 flex flex-wrap">
            {projectsData.map((d) => (
              <Card
                key={d.title}
                title={d.title}
                description={d.description}
                imgSrc={d.imgSrc}
                href={d.href}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
