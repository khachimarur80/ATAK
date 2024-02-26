const express = require('express');
const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');
const fs = require('fs'); 
const ngrok = require('ngrok')

const API_token = "5767381574:AAH6Su1hW6bSZjI3dUqibyMqiJyVuum4LuI";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('/locations', (ws, req) => {
  console.log('WebSocket connected');

  ws.on('message', (msg) => {
    console.log('Received message:', msg);
    ws.send(msg); // Echo back the received message
  });
});

server.listen(4000, function listening() {
  console.log('Server started on http://localhost:4000');
});


const toRadians = (degrees) => {
  return degrees * Math.PI / 180;
}

const bot = new TelegramBot(API_token, {
  webHook: {
    port: 3000
  }
});

(async function() {
  const url = 'https://c6ba-169-150-196-109.ngrok-free.app'
  console.log('Ngrok URL:', url);
  bot.setWebHook(`${url}/bot${API_token}`);
})();

let vectors = []

function calculateBearing(lat1, lon1, lat2, lon2) {
  const lat1Rad = toRadians(lat1);
  const lon1Rad = toRadians(lon1);
  const lat2Rad = toRadians(lat2);
  const lon2Rad = toRadians(lon2);

  const dLon = lon2Rad - lon1Rad;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  let bearingRad = Math.atan2(y, x);

  bearingRad = (bearingRad + Math.PI * 2) % (Math.PI * 2);
  const bearingDeg = bearingRad * (180/Math.PI);

  return bearingDeg;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  let dLat = lat2 - lat1;
  let dLon = lon2 - lon1;
  
  let a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return 6371000 * c;
}

function generateSVGFromPolar(vectors) {
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg">`;

  let currentX = 500;
  let currentY = 500;

  for (let i = 0; i < vectors.length; i++) {
    const module = vectors[i].module;
    const angle = vectors[i].angle;

    const newX = currentX + module * Math.cos(angle * Math.PI / 180);
    const newY = currentY + module * Math.sin(angle * Math.PI / 180);

    svgContent += `<line x1="${currentX}" y1="${currentY}" x2="${newX}" y2="${newY}" stroke="black" stroke-width="1"/>`;

    currentX = newX;
    currentY = newY;
  }

  svgContent += `</svg>`;
  return svgContent;
}


bot.on('message', (msg) => {
  if (msg.text) {
    if (msg.text==='/init') {
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
})

bot.on('edited_message', (msg) => {
  if (msg.location) {
    wss.clients.forEach((client) => {
      client.send(JSON.stringify({
        type: 'location',
        data: msg,
      }))
    })
    /*bot.sendMessage(msg.chat.id, 
      `
      Location received from ${msg.from.first_name}
        Longitude: ${msg.location.longitude}
        Latitude: ${msg.location.latitude}
        Heading: ${msg.location.heading}
      `
    )*/
  }
})

function createSVGFile(svgContent) {
  fs.writeFileSync('output.svg', svgContent, 'utf-8');
}

process.on('SIGINT', () => {
  console.log('Script is exiting.');
  if (vectors.length) {
    console.log('Creating SVG file ...')
    let svgContent = generateSVGFromPolar(vectors);
    createSVGFile(svgContent);
  }
  process.exit()
});