import * as service from './service.js';

export async function upload(req, res, next) {
  try {
    const payload = req.body;
    const filename = req.query.filename; // optional

    const result = await service.processImport(payload, filename);
    res.status(201).json({ message: 'Imported', id: result.id, path: result.path });
  } catch (err) {
    next(err);
  }
}
