export async function saveFile(obj, filename) {
  const url = filename ? `/api/save?filename=${encodeURIComponent(filename)}` : '/api/save'
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  })
  let data = null
  try { data = await resp.json() } catch (e) { /* ignore */ }
  if (!resp.ok) {
    const err = new Error((data && (data.error || data.message)) || `Import failed (${resp.status})`)
    err.details = data
    throw err
  }
  return data
}

export async function getFile(filename) {
  const url = `/api/load?filename=${encodeURIComponent(filename)}`
  const resp = await fetch(url)
  let data = null
  try { data = await resp.json() } catch (e) { /* ignore */ }
  if (!resp.ok) {
    const err = new Error((data && (data.error || data.message)) || `Fetch failed (${resp.status})`)
    err.details = data
    throw err
  }
  return data
}

export async function getAdventureMetadata(adventureName) {
  const url = `/api/adventures/${encodeURIComponent(adventureName)}/metadata`
  const resp = await fetch(url)
  let data = null
  try { data = await resp.json() } catch (e) { /* ignore */ }
  if (!resp.ok) {
    const err = new Error((data && (data.error || data.message)) || `Fetch failed (${resp.status})`)
    err.details = data
    throw err
  }
  return data
}

export async function getAllAdventures() {
  const url = '/api/adventures'
  const resp = await fetch(url)
  let data = null
  try { data = await resp.json() } catch (e) { /* ignore */ }
  if (!resp.ok) {
    const err = new Error((data && (data.error || data.message)) || `Fetch failed (${resp.status})`)
    err.details = data
    throw err
  }
  return data
}
