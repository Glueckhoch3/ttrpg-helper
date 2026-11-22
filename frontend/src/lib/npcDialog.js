import { reactive } from 'vue'
// One shared NPC detail dialog (rendered by StoryView); any component opens it with openNpc(id).
export const npcDialog = reactive({ id: null })
export const openNpc = (id) => { npcDialog.id = id }
