const { WebSocketServer } = require('ws');

let wss = null;

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    ws.send(JSON.stringify({ type: 'connected', message: 'Digital Wall WS ready' }));

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });
  });

  console.log('WebSocket server listening on /ws');
  return wss;
}

function broadcast(payload) {
  if (!wss) return;
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

module.exports = { initWebSocket, broadcast };
