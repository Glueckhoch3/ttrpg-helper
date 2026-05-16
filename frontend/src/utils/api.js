export async function saveFile(obj, filename) {
  const url = filename ? `/api/import?filename=${encodeURIComponent(filename)}` : '/api/import'
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
  const url = `/api/export?filename=${encodeURIComponent(filename)}`
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
