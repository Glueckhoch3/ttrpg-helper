export function richTextToDisplayText(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return ''
  }

  // Keep non-HTML values untouched.
  if (!/<\/?[a-z][\s\S]*>/i.test(trimmedValue)) {
    return trimmedValue
  }

  if (typeof document === 'undefined') {
    return trimmedValue.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  }

  const container = document.createElement('div')
  container.innerHTML = trimmedValue
  return (container.innerText || container.textContent || '').replace(/\u00a0/g, ' ').trim()
}

const NPC_LINK_HASH_PREFIX = '#npc:'
const NPC_LINK_BASE_URL = 'https://ttrpg-helper.local/npc/'

export function buildNpcHref(npcId) {
  const normalizedId = String(npcId ?? '').trim()
  if (!normalizedId) {
    return ''
  }

  return `${NPC_LINK_HASH_PREFIX}${encodeURIComponent(normalizedId)}`
}

export function parseNpcHref(href) {
  const normalizedHref = String(href ?? '').trim()
  if (!normalizedHref) {
    return ''
  }

  if (normalizedHref.startsWith(NPC_LINK_HASH_PREFIX)) {
    return decodeURIComponent(normalizedHref.slice(NPC_LINK_HASH_PREFIX.length)).trim()
  }

  try {
    const parsedUrl = new URL(normalizedHref, NPC_LINK_BASE_URL)
    if (parsedUrl.origin !== 'https://ttrpg-helper.local') {
      return ''
    }

    if (!parsedUrl.pathname.startsWith('/npc/')) {
      return ''
    }

    const encodedNpcId = parsedUrl.pathname.slice('/npc/'.length)
    return decodeURIComponent(encodedNpcId).trim()
  } catch {
    return ''
  }
}

export function isNpcLinkAnchor(anchorElement) {
  if (!anchorElement || typeof anchorElement.getAttribute !== 'function') {
    return false
  }

  return Boolean(parseNpcHref(anchorElement.getAttribute('href')))
}

export function replaceSingleNpcLinkInHtml(html, target, replacementNpc) {
  const sourceHtml = typeof html === 'string' ? html : ''
  const targetHref = String(target?.href ?? '').trim()
  const targetText = String(target?.text ?? '')
  const targetOccurrence = Number.isInteger(target?.occurrence) ? target.occurrence : -1
  const replacementHref = buildNpcHref(replacementNpc?.id)
  const replacementName = String(replacementNpc?.name ?? '').trim()

  if (!sourceHtml || !targetHref || !replacementHref || !replacementName || targetOccurrence < 0) {
    return sourceHtml
  }

  if (typeof document === 'undefined') {
    return sourceHtml
  }

  const container = document.createElement('div')
  container.innerHTML = sourceHtml

  let occurrenceIndex = -1
  const anchorElements = container.querySelectorAll('a[href]')
  for (const anchorElement of anchorElements) {
    const anchorHref = anchorElement.getAttribute('href') || ''
    const anchorText = anchorElement.textContent || ''
    if (anchorHref !== targetHref || anchorText !== targetText) {
      continue
    }

    occurrenceIndex += 1
    if (occurrenceIndex !== targetOccurrence) {
      continue
    }

    anchorElement.setAttribute('href', replacementHref)
    anchorElement.textContent = replacementName
    return container.innerHTML
  }

  return sourceHtml
}