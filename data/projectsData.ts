interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
}

const projectsData: Project[] = [
  {
    title: 'TeslaMate CN Docker',
    description: `该适用于中国大陆的 TeslaMate 镜像已实现全面界面汉化，并通过集成代理服务保障 OpenStreetMap 访问，同时支持调用百度地图 API 进行逆地址解析以提升定位精度，且提供 Docker Compose 配置简化了部署流程实现一键启动。`,
    imgSrc: '/static/images/teslamate.png',
    href: 'https://github.com/gococonut/teslamate-cn-docker',
  },
  {
    title: '字节篝火播客',
    description: `通过 N8N workflow 实现自动化，将 Hacker News 与 GitHub Trending 的每日精华转化为音频播客。便于高效获取技术热点与行业趋势。每期播客的 Shownotes 提供所有内容的摘要链接，便于快速查阅详情。`,
    imgSrc: '/static/images/podcast.png',
    href: 'https://BYTEBONFIRE.PODCAST.XYZ',
  },
  {
    title: '字节篝火网站',
    description: `字节篝火网站，致力于扫除信息壁垒，高效获取全球技术前沿。通过 N8N workflow 实现精选来源，聚合 Hacker News、GitHub Trending 等优质技术社区内容。自动完成中文化翻译与摘要提炼。便于快速把握技术热点与行业脉动。
 更进一步，字节篝火播客 Shownotes 与网站无缝联动，让信息获取与深度学习相得益彰。`,
    imgSrc: '/static/images/ByteBonfireWeb.png',
    href: 'https://bytebonfire.com',
  },
]

export default projectsData
