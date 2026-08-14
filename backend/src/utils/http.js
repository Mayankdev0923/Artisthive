export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err);
  const status = err.status || (err.message?.includes('Unauthorized') ? 401 : 500);
  res.status(status).json({ error: err.message || 'Internal server error' });
}