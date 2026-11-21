// Server-Sent Events hub: clients refetch on events (ADR-007).
export function createHub() {
  const clients = new Set();
  return {
    handler(req, res) {
      res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.flushHeaders();
      res.write('retry: 2000\n\n');
      clients.add(res);
      const ping = setInterval(() => res.write(': ping\n\n'), 25000);
      req.on('close', () => { clearInterval(ping); clients.delete(res); });
    },
    emit(type, id = null) {
      const msg = `data: ${JSON.stringify({ type, id })}\n\n`;
      for (const c of clients) c.write(msg);
    },
    close() { for (const c of clients) c.end(); clients.clear(); },
  };
}
