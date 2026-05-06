import app from './app.js';
import { PORT } from './config/index.js';

const port = PORT || 3000;

const server = app.listen(port, () => {
	console.log(`Backend listening on port ${port}`);
});

process.on('SIGINT', () => {
	console.log('Shutting down server...');
	server.close(() => process.exit(0));
});