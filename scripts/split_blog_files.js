#!/usr/bin/env node

/**
 * 将按日期聚合的博客内容拆分成单独的文件
 * 用法: node scripts/split_blog_files.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { slug } = require('github-slugger');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// 文件路径配置
const SOURCES = [
  {
    dir: 'data/blog/hacker-news',
    sourceType: 'hacker-news',
    outputDir: 'data/blog/articles/hacker-news'
  },
  {
    dir: 'data/blog/github-trendings',
    sourceType: 'github-trending',
    outputDir: 'data/blog/articles/github-trending'
  }
];

// 确保输出目录存在
async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
    console.log(`目录已创建: ${dir}`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

// 从文章内容中提取元数据
function extractMetadata(content) {
  const metadataMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!metadataMatch) return null;

  const metadataStr = metadataMatch[1];
  const metadata = {};

  // 提取标准元数据字段
  const titleMatch = metadataStr.match(/title:\s*(.+)/);
  if (titleMatch) metadata.title = titleMatch[1].replace(/['"]/g, '');

  const dateMatch = metadataStr.match(/date:\s*(.+)/);
  if (dateMatch) metadata.date = dateMatch[1];

  const coverMatch = metadataStr.match(/cover:\s*(.+)/);
  if (coverMatch) metadata.cover = coverMatch[1];

  const tagsMatch = metadataStr.match(/tags:\s*\[(.*)\]/);
  if (tagsMatch) metadata.tags = tagsMatch[1].split(',').map(tag => tag.trim());

  const summaryMatch = metadataStr.match(/summary:\s*(.+)/);
  if (summaryMatch) metadata.summary = summaryMatch[1];

  return metadata;
}

// 生成 slug 的函数
function generateSlug(title) {
  return slug(title);
}

// 解析单个日期聚合文件
async function parseAggregatedFile(filePath, sourceType, outputDir) {
  console.log(`正在处理文件: ${filePath}`);

  const content = await readFile(filePath, 'utf8');

  // 提取元文件元数据
  const metadataMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!metadataMatch) {
    console.warn(`无法从文件中提取元数据: ${filePath}`);
    return;
  }

  const globalMetadata = extractMetadata(content);

  // 去除文件头部的元数据部分
  const contentWithoutHeaderMetadata = content.replace(/^---\n[\s\S]*?\n---/, '').trim();

  // 使用 --- 或 ---- 作为分隔符分割文章
  // 首先尝试使用 ---- 分割，如果只有一个部分，则尝试使用 --- 分割
  let articleParts = contentWithoutHeaderMetadata.split(/\n----\n/);

  // 如果没有 ---- 分隔符，尝试使用 --- 分隔符
  if (articleParts.length <= 1) {
    articleParts = contentWithoutHeaderMetadata.split(/\n---\n/);
  }

  // 如果仍然没有分隔出多个部分，使用原来的逻辑（根据二级标题分割）
  if (articleParts.length <= 1) {
    console.log(`未找到分隔符，使用二级标题分割文章: ${filePath}`);
    articleParts = contentWithoutHeaderMetadata.split(/\n## /).filter(part => part.trim());

    // 如果是使用二级标题分割的，需要对每个部分进行特殊处理
    if (articleParts.length > 0) {
      for (let i = 1; i < articleParts.length; i++) {
        // 给除第一个部分外的每个部分添加二级标题前缀
        articleParts[i] = '## ' + articleParts[i];
      }
    }
  }

  if (articleParts.length === 0) {
    console.warn(`未找到文章部分: ${filePath}`);
    return;
  }

  console.log(`找到 ${articleParts.length} 篇文章`);

  // 处理每篇文章
  for (let i = 0; i < articleParts.length; i++) {
    const articleContent = articleParts[i].trim();

    // 从文章内容中提取标题，仅用于生成文件名
    let title = '';

    // 尝试提取二级标题作为文章标题
    const titleMatch = articleContent.match(/^## (.*?)(?:\n|$)/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      // 如果没有找到二级标题，尝试提取第一行作为标题
      title = articleContent.split('\n')[0].trim();
    }

    // 尝试提取发布日期，仅用于文件名
    let sourceDate = '';
    const dateMatch = articleContent.match(/\*\*发布时间:\*\* (.*?)(?:\n|$)/);
    if (dateMatch) {
      const datePart = dateMatch[1].match(/(\d{4}-\d{2}-\d{2})/);
      sourceDate = datePart ? datePart[1] : globalMetadata.date;
    } else {
      sourceDate = globalMetadata.date;
    }

    // 使用 github-slugger 生成 slug
    const slug = generateSlug(title);

    // 生成文件名
    const fileName = `${sourceDate}-${slug}.mdx`;
    const outputPath = path.join(outputDir, fileName);

    // 构建新的元数据
    const newMetadata = {
      title: title,
      date: globalMetadata.date,
      sourceDate: sourceDate,
      sourceType: sourceType,
      tags: globalMetadata.tags,
      cover: globalMetadata.cover,
    };

    // 生成新的MDX内容
    let newContent = '---\n';
    for (const [key, value] of Object.entries(newMetadata)) {
      if (Array.isArray(value)) {
        newContent += `${key}: [${value.join(', ')}]\n`;
      } else if (value) {
        newContent += `${key}: '${value}'\n`;
      }
    }
    newContent += '---\n\n';

    // 直接添加原始文章内容
    newContent += articleContent + '\n';

    // 写入新文件
    try {
      await writeFile(outputPath, newContent, 'utf8');
      console.log(`已创建文件: ${outputPath}`);
    } catch (error) {
      console.error(`写入文件时出错: ${outputPath}`, error);
    }
  }
}

async function main() {
  try {
    // 确保输出目录存在
    for (const source of SOURCES) {
      await ensureDir(source.outputDir);
    }

    // 处理每个源目录
    for (const source of SOURCES) {
      const files = await readdir(source.dir);

      // 筛选出日期格式的MDX文件（如2025-05-01.mdx）
      const dateFiles = files.filter(file => /^\d{4}-\d{2}-\d{2}\.mdx$/.test(file));

      console.log(`在 ${source.dir} 中找到 ${dateFiles.length} 个日期聚合文件`);

      // 处理每个文件
      for (const file of dateFiles) {
        const filePath = path.join(source.dir, file);
        await parseAggregatedFile(filePath, source.sourceType, source.outputDir);
      }
    }

    console.log('所有文件处理完成！');
  } catch (error) {
    console.error('处理过程中出错:', error);
  }
}

main();