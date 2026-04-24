// Shared reference to the BottomPlayer's <audio> element.
// BeatCard and BeatPageClient set audio.src and call audio.play() directly from
// click handlers so iOS Safari's user-gesture requirement is satisfied synchronously,
// rather than through the React useEffect chain (which breaks the gesture context).
export const sharedAudioElement: { current: HTMLAudioElement | null } = { current: null }
