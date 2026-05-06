import { readJson } from '../importer/model.js';

export async function download(req, res, next) {
  try {
    const filename = req.query.filename;
    if (!filename) {
      const err = new Error('filename query parameter required');
      err.status = 400;
      throw err;
    }

    const data = await readJson(filename);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
