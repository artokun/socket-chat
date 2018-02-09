const W3CWebSocket = require('websocket').w3cwebsocket;
const vorpal = require('vorpal')();
const inquirer = require('inquirer');
const chalk = require('chalk');
const CLI = require('clui');
const notifier = require('node-notifier');
const Preferences = require('preferences');

const clear = CLI.Clear;
var prefs = new Preferences('com.ws-chat-app', {
  username: '',
});
let instance;

// var client = new W3CWebSocket('wss://socket-chat-bxpqmnuowa.now.sh');
var client = new W3CWebSocket('ws://localhost:8080');

client.onerror = function() {
  console.log('Connection Error');
};

client.onopen = function() {
  console.log('WebSocket Client Connected');

  if (client.readyState === client.OPEN) {
    chatApp(client);
  }
};

client.onclose = function() {
  console.log('echo-protocol Client Closed');
  client = new W3CWebSocket('ws://localhost:8080');
};

client.onmessage = function(e) {
  if (typeof e.data === 'string') {
    clear();
    const messages = JSON.parse(e.data);
    const chat = messages.map(({ username, message }) => {
      return chalk.yellow(username) + ': ' + message;
    });
    instance.log(chat.join('\n'));
  }
};

function chatApp(client) {
  vorpal.catch('[words...]', 'Chat').action(function(args, cb) {
    instance = this;
    if (!prefs.username) {
      return inquirer
        .prompt([
          {
            type: 'input',
            name: 'username',
            message: 'Choose a username',
          },
        ])
        .then(({ username }) => {
          if (username) {
            prefs.username = username;
          }
        });
    }
    try {
      client.send(
        JSON.stringify({
          username: prefs.username,
          message: args.words.join(' '),
        })
      );
      cb();
    } catch (e) {
      this.log(chalk.red("don't use |, you'll break me!", e));
      cb();
    }
  });

  // show
  vorpal.delimiter(`$cli-chat${':' + prefs.username || ''}>`).show();
}
