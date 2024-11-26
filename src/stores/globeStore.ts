import { create } from 'zustand'

interface GlobeState {
  highlightedRegion: string | null
  setHighlightedRegion: (region: string | null) => void
  cameraPosition: [number, number, number]
  setCameraPosition: (position: [number, number, number]) => void
  effectMode: 'normal' | 'fire' | 'storm'
  setEffectMode: (mode: 'normal' | 'fire' | 'storm') => void
  showImmersiveView: boolean
  setShowImmersiveView: (show: boolean) => void
}

export const useGlobeStore = create<GlobeState>((set) => ({
  highlightedRegion: null,
  setHighlightedRegion: (region) => set({ highlightedRegion: region }),
  cameraPosition: [0, 0, 5],
  setCameraPosition: (position) => set({ cameraPosition: position }),
  effectMode: 'normal',
  setEffectMode: (mode) => set({ effectMode: mode }),
  showImmersiveView: false,
  setShowImmersiveView: (show) => set({ showImmersiveView: show }),
})) 