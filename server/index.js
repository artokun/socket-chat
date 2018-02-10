#!/usr/bin/env node
const WebSocketServer = require('websocket').server;
const http = require('http');
const PORT = process.env.PORT || 8080;

var server = http.createServer(function(request, response) {
  console.log(new Date() + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});

let messages = [];

const clients = new Map();
const subscriptions = new Map();
subscriptions.set('general', new Set());

server.listen(PORT, function() {
  console.log(new Date() + ' Server is listening on port', PORT);
});

wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false,
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
  // Approve or Deny connection request
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log(
      new Date() + ' Connection from origin ' + request.origin + ' rejected.'
    );
    return;
  }
  // Accept connection
  const client = request.accept('chat-app', request.origin);

  /*
  // needs implementing
  let client = {
    id: 1,
    isAuthenticated: true,
    protocolVersion: 1,
    connection: <WebSocket Connection instance>
  }
  */

  // Collect clients and assign to general chat
  clients.set(client.id, client);
  subscriptions.get('general').add(client.id);

  console.log(new Date() + ' Connection accepted from ' + client.remoteAddress);

  // Send initial messages to the user
  client.sendUTF(
    JSON.stringify({
      msg: 'initMessages',
      // data: messages.slice(Math.max(messages.length - 15, 1)), // return last 15 messages
      data: messages,
    })
  );

  // Handle closed clients
  client.on('close', function(reasonCode, description) {
    // Unsubscribe client from general and remove from clients list
    subscriptions.get('general').delete(client.id);
    clients.delete(client.id);
    console.log(
      new Date() + ' Peer ' + client.remoteAddress + ' disconnected.'
    );
  });

  // Handle incoming messages
  client.on('message', function(message) {
    // Check message type
    if (message.type !== 'utf8') {
      return console.log('Invalid Message Type: ', type);
    }
    try {
      let parsedMessage = JSON.parse(message.utf8Data);

      switch (parsedMessage.msg) {
        case 'clear':
          messages = [];
          break;
        case 'sendMessage':
          messages.push(parsedMessage.data);
          break;
      }

      // broadcast message to all clients
      subscriptions.get('general').forEach(clientId => {
        clients.get(clientId).sendUTF(message.utf8Data);
      });
    } catch (e) {
      console.log('Server error: ', e);
    }
  });
});
