const W3CWebSocket = require('websocket').w3cwebsocket;
const vorpal = require('vorpal')();
const inquirer = require('inquirer');
const chalk = require('chalk');
const CLI = require('clui');
const notifier = require('node-notifier');
const Preferences = require('preferences');

const clear = CLI.Clear;
let prefs = new Preferences('com.ws-chat-app', {
  username: '',
});
let instance;
let messages = [];

let client = new W3CWebSocket(
  'wss://socket-chat-nipcjrifnw.now.sh',
  'chat-app'
);
// let client = new W3CWebSocket('ws://localhost:8080', 'chat-app');

client.onerror = function(error) {
  vorpal.log('Connection Error');
};

client.onopen = function() {
  vorpal.log('WebSocket Client Connected');
  //socket-chat-nipcjrifnw.now.sh

  https: if (client.readyState === client.OPEN) {
    chatApp(client);
  }
};

client.onclose = function() {
  vorpal.log('chat-app Client Closed');
};

client.onmessage = function(e) {
  if (typeof e.data === 'string') {
    try {
      let message = JSON.parse(e.data);
      switch (message.msg) {
        case 'clear':
          messages = [];
        case 'initMessages':
          messages = message.data;
          break;
        case 'sendMessage':
          messages.push(message.data);
          break;
      }

      if (messages.length) {
        let chatLog = messages.map(
          log => chalk.yellow(`${log.username}: `) + `${log.message}`
        );
        clear();
        vorpal.log(chatLog.join('\n'));
      }
    } catch (e) {
      vorpal.log('Client Error: ', e);
    }
  }
};

function chatApp(client) {
  vorpal.catch('[words...]', 'Chat').action(function(args, cb) {
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
          msg: 'sendMessage',
          data: {
            username: prefs.username,
            message: args.words.join(' '),
          },
        })
      );
      cb();
    } catch (e) {
      this.log(chalk.red("  Don't use '|', you'll break me!", e));
      cb();
    }
  });

  // show
  vorpal.delimiter(`$cli-chat${':' + prefs.username || ''}>`).show();
}
