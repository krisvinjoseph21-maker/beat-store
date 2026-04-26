'use client'

import { useEffect } from 'react'
import { useLocaleStore } from '@/lib/locale'

export default function HtmlLang() {
  const language = useLocaleStore((s) => s.language)
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])
  return null
}
