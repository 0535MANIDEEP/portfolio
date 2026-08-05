'use client'

import { useTheme } from 'next-themes'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Register only the languages we actually use — this keeps the bundle small
// and avoids the 30-90s Turbopack compile time caused by importing the full
// Prism library (which bundles hundreds of language definitions).
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go'
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import hcl from 'react-syntax-highlighter/dist/esm/languages/prism/hcl'
import docker from 'react-syntax-highlighter/dist/esm/languages/prism/docker'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'

SyntaxHighlighter.registerLanguage('yaml', yaml)
SyntaxHighlighter.registerLanguage('yml', yaml)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('sh', bash)
SyntaxHighlighter.registerLanguage('shell', bash)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('js', javascript)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('ts', typescript)
SyntaxHighlighter.registerLanguage('jsx', jsx)
SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('py', python)
SyntaxHighlighter.registerLanguage('go', go)
SyntaxHighlighter.registerLanguage('golang', go)
SyntaxHighlighter.registerLanguage('java', java)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('hcl', hcl)
SyntaxHighlighter.registerLanguage('terraform', hcl)
SyntaxHighlighter.registerLanguage('docker', docker)
SyntaxHighlighter.registerLanguage('dockerfile', docker)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('md', markdown)
SyntaxHighlighter.registerLanguage('css', css)

export function ThemedCodeBlock({ language, children }: { language: string; children: string }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const code = String(children).replace(/\n$/, '')

  return (
    <SyntaxHighlighter
      style={isDark ? oneDark : oneLight}
      language={language || 'bash'}
      PreTag="div"
      className={`rounded-lg !p-4 !text-sm !border !border-border ${isDark ? '!bg-[#282c34]' : '!bg-[#fafafa]'}`}
      showLineNumbers={code.split('\n').length > 3}
      lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: isDark ? '#555' : '#aaa', userSelect: 'none' }}
    >
      {code}
    </SyntaxHighlighter>
  )
}

export function getThemedStyle() {
  return oneDark
}
