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