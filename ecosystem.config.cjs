module.exports = {
  apps: [
    {
      name: 'vite-preview',
      script: './node_modules/vite/bin/vite.js',
      args: 'preview --port 5173 --host 0.0.0.0',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};