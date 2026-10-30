// development server (`yarn serve`): web app served by vite with hot reload, default secret, listening to localhost
process.env.NODE_ENV = 'development';

// once NODE_ENV is set: static imports would run first
await import('./index');

export {};
