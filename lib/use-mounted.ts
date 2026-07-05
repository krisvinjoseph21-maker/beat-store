'use client'

import { useSyncExternalStore } from 'react'

function subscribe() {
  return () => {}
}

function getSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

// True only after the client has hydrated — matches the SSR snapshot on first
// paint (avoiding a mismatch) and flips true on the following render.
export function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
