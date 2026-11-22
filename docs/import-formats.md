# Import formats (Blueprints)

GM menu: *Blueprints → Import…* Choose a format, the content type (Creature / Item) and a `.json` file, tick the entries, import. Entries whose name already exists (same type) are skipped. Spell descriptions will be added later as another content type.

| Format | Expected file | Notes |
|---|---|---|
| Open5e (`open5e`) | Saved responses of `api.open5e.com`: `{"results":[…]}` or a plain array. Creatures: `/v1/monsters/`; items: `/v1/magicitems/`, `/v1/weapons/`, `/v1/armor/` | Open game content (SRD). Use `?limit=500` to get more per file. |
| 5etools (`5etools`) | Data files with a `monster` array (creatures) or `item` / `baseitem` array (items) | `_copy` entries are skipped, `{@tag}` markup is removed. Check the licence of your source. |
| TTRPG Helper (`ttrpg`) | see below | Use it to convert any other source by hand or script. |

## TTRPG Helper format
```json
{
  "creatures": [
    { "name": "Cave Bear", "subtitle": "Large beast", "body": "Maul. +6 to hit, 2d6+4.",
      "stats": [ { "title": "AC", "value": "11" }, { "title": "HP", "value": "42" } ] }
  ],
  "items": [ { "name": "Rusty Key", "subtitle": "loot", "body": "Opens the cellar.", "stats": { "Weight": "1 lb" } } ]
}
```
`stats` may be a list of `{title, value}` or an object. Limits (longer text is cut): name 200, subtitle 200, body 12000, stat title 40, stat value 300, 40 stats, max. 1000 entries per import, file up to 15 MB.

## Linking to symbols
Select a symbol on a locked-grid map as GM → *Linked data*: one NPC, one Creature Blueprint, up to five Item Blueprints. Everyone who can see the map gets collapsible bars (names) in the *Details* panel; content loads when a bar is opened.
