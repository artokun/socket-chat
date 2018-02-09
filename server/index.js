#!/usr/bin/env node
const WebSocketServer = require('websocket').server;
const http = require('http');
const PORT = process.env.PORT || 8080;

var server = http.createServer(function(request, response) {
  console.log(new Date() + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});

let connections = [];
let messages = [];

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
  const connection = request.accept('chat-app', request.origin);

  // Collect connection
  connections.push(connection);
  console.log(
    new Date() + ' Connection accepted from ' + connection.remoteAddress
  );

  // Send initial messages to the user
  connection.sendUTF(
    JSON.stringify({
      msg: 'initMessages',
      // data: messages.slice(Math.max(messages.length - 15, 1)), // return last 15 messages
      data: messages,
    })
  );

  // Handle closed connections
  connection.on('close', function(reasonCode, description) {
    var index = connections.indexOf(connection);
    if (index !== -1) {
      // remove the connection from the pool
      connections.splice(index, 1);
    }
    console.log(
      new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.'
    );
  });

  // Handle incoming messages
  connection.on('message', function(message) {
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
      connections.forEach(connection => {
        connection.sendUTF(message.utf8Data);
      });
    } catch (e) {
      console.log('Server error: ', e);
    }
  });
});
