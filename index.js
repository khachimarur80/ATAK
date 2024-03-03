//Dependencies
const express = require('express')
const http = require('http')
const TelegramBot = require('node-telegram-bot-api')
const WebSocket = require('ws')
const fs = require('fs');
const ngrok = require('ngrok')
const { exec } = require('child_process')

//Tokens and variables
const API_token = "5767381574:AAH6Su1hW6bSZjI3dUqibyMqiJyVuum4LuI"
const expressPort = 4000
const ngrokPort = 3000

//Server and websocket instances intialization
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

//Create new websocket route
wss.on('/locations', (ws, req) => {
  //Check for successfull connection
  console.log('WebSocket connected');
});

//Server initialization
server.listen(expressPort, function listening() {
  console.log(`Server started on http://localhost:${expressPort}`);
});

//Bot instance declaration
const bot = new TelegramBot(API_token, {
  //Add webhook to ngrok local server
  webHook: {
    port: ngrokPort
  }
});

const ngrokProcess = exec(`ngrok http ${ngrokPort}`);

(async function() {
  try {
    const ngrokUrl = await ngrok.connect(ngrokPort);
    console.log('Ngrok tunnel created:', ngrokUrl);

    // Set bot webhook
    await bot.setWebHook(`${ngrokUrl}/bot${API_token}`);
    console.log('Telegram bot webhook set:', `${ngrokUrl}/bot${API_token}`);
  } 
  catch (error) {
    console.error('Error starting Ngrok:', error);
  }
})();

//Bot event listeners
bot.on('message', (msg) => {
  if (msg.text) {
    if (msg.text==='/init') {
      bot.sendMessage(msg.chat.id,`Nuevo chat con ID ${msg.chat.id} registrado en InforMission!`)
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({
          type: 'init',
          data: msg.chat,
        }))
      })
    }
    else if (msg.text) {
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({
          type: 'message',
          data: msg,
        }))
      })
    }
  }
  else if (msg.photo) {
    const photoId = msg.photo[msg.photo.length - 1].file_id;
    
    bot.getFile(photoId).then((photoInfo) => {
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({
          type: 'message',
          data: {
            src: `https://api.telegram.org/file/bot${API_token}/${photoInfo.file_path}`,
            caption: msg.caption,
          },
        }))
      })
    })
  }
})

bot.on('edited_message', async (msg) => {
  if (msg.location) {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;
    const chatMember = await bot.getChatMember(chatId, senderId);

    if (chatMember.status === 'administrator' || chatMember.status === 'creator') {
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({
          type: 'location',
          data: msg,
        }))
      })
    }
  }
})