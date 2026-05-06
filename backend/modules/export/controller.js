import { readJson } from '../importer/model.js';

export async function download(req, res, next) {
  try {
    const filename = req.query.filename;
    if (!filename) {
      const err = new Error('filename query parameter required');
      err.status = 400;
      throw err;
    }

    // Validate filename ending
    if (typeof filename === 'string' && !filename.toLowerCase().endsWith('.json')) {
      const err = new Error('The file ending has been tampered with; ensure a .json file.');
      err.status = 400;
      throw err;
    }

    const data = await readJson(filename);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
