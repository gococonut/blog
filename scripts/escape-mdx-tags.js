// scripts/escape-mdx-tags.js
import fs from 'fs'
import path from 'path'

const files = process.argv.slice(2) // 获取 lint-staged 传入的文件列表

files.forEach((file) => {
  const filePath = path.resolve(file)
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8')
    let newContent = originalContent

    // 使用正则表达式匹配 **...** 块，并对其中的 < 和 > 进行转义
    newContent = newContent.replace(/\*\*(.*?)\*\*/gs, (match, innerContent) => {
      // 检查 innerContent 是否真的包含需要转义的 < 或 >
      if (innerContent.includes('<') || innerContent.includes('>')) {
        // 修正：只转义前面没有反斜杠的 < 和 >
        const escapedInnerContent = innerContent
          .replace(
            /(?<!\\)<(?!\/|\\w|\\s*!--)/g, // 匹配 <，要求前面不是 \，且后面不是 / 或 单词 或 <!--
            '\\<'
          )
          .replace(
            /(?<!\\)>(?!\\s*--)/g, // 匹配 >，要求前面不是 \，且后面不是 --
            '\\>'
          )

        // 如果内容改变了，才用转义后的版本
        if (escapedInnerContent !== innerContent) {
          // 重新包裹 **
          return `**${escapedInnerContent}**`
        }
      }
      // 如果没有需要转义的或转义后无变化，返回原匹配内容
      return match
    })

    // 新增：将 \( ... \) 替换为 $ ... $
    newContent = newContent.replace(/\\\\?\(([^)]+)\\\\?\)/g, (match, equation) => {
      const cleanEquation = equation.trim()
      return `$ ${cleanEquation} $`
    })

    // 仅当内容实际发生更改时才写回文件
    if (newContent !== originalContent) {
      fs.writeFileSync(filePath, newContent, 'utf8')
      console.log(`✅ Fixed escaping in: ${path.relative(process.cwd(), filePath)}`)
    }
  } catch (error) {
    console.error(`❌ Error processing file ${file}:`, error)
    process.exit(1) // 出错时终止 pre-commit
  }
})

process.exit(0) // 成功完成
