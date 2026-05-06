import * as service from './service.js';

export async function upload(req, res, next) {
  try {
    const payload = req.body;
    const filename = req.query.filename; // optional

    // Validate filename ending if provided
    if (filename && typeof filename === 'string' && !filename.toLowerCase().endsWith('.json')) {
      const err = new Error('The file ending has been tampered with; ensure a .json file.');
      err.status = 400;
      throw err;
    }

    const result = await service.processImport(payload, filename);
    res.status(201).json({ message: 'Imported', id: result.id, path: result.path });
  } catch (err) {
    next(err);
  }
}
