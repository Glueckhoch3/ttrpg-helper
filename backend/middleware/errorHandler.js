export default function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err && err.status ? err.status : 500;
  const payload = { error: err.message || 'Internal Server Error' };
  if (process.env.NODE_ENV !== 'production' && err && err.details) {
    payload.details = err.details;
  }
  // avoid leaking stack or local paths in production
  res.status(status).json(payload);
}
