'use client'
import dynamic from 'next/dynamic'
const AudioReactiveStage = dynamic(() => import('./AudioReactiveStage'), { ssr: false })
export default function AudioReactiveStageLoader() {
  return <AudioReactiveStage />
}
