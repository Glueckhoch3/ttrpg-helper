import { onMounted, onUnmounted } from 'vue'
import { onEvent } from './api'

/** Run `load` on mount and whenever one of `types` is broadcast (debounced). */
export function useLive(types, load) {
  let off, t
  onMounted(() => {
    load()
    off = onEvent((e) => {
      if (!types.includes(e.type)) return
      clearTimeout(t)
      t = setTimeout(load, 100)
    })
  })
  onUnmounted(() => { off?.(); clearTimeout(t) })
}
