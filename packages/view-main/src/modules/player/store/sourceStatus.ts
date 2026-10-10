import { writable } from 'svelte/store'
export const playbackSource = writable<{ musicId: string; name: string } | null>(null)
