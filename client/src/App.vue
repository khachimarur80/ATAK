<template>
  <div class="container" v-if="currentChat">
    <mapView :points="points"/>
    <messagesView :messages="messages"/>
  </div>
  <div class="chat-list" v-else>
    <div class="chat" v-for="(chat, i) in chats" :key="i">
      <p class="chat-info">ID: {{ chat.id }}</p>
      <p class="chat-info">Title: {{ chat.title }}</p>
      <p class="chat-info">Type: {{ chat.type }}</p>
      <div class="view-chat-container">
        <button class="view-chat" @click="currentChat=chat">Ver</button>
      </div>
    </div>
  </div>
</template>

<script>

import mapView from './components/mapView.vue'
import messagesView from './components/messagesView.vue'

export default {
  name: 'App',
  components: {
    mapView,
    messagesView
  },
  data: () => ({
    chats: [],
    currentChat: null,
    ws: null,
    messages: [],
    points: {},
  }),
  mounted() {
    //localStorage.setItem('chats', '')
    //localStorage.setItem('messages', '')
    //localStorage.setItem('points', '')
    if (localStorage.getItem('chats')) {
      this.chats = JSON.parse(localStorage.getItem('chats'))
    }
    if (localStorage.getItem('messages')) {
      this.messages = JSON.parse(localStorage.getItem('messages'))
    }
    if (localStorage.getItem('points')) {
      this.points = JSON.parse(localStorage.getItem('points'))
    }
    //Websocket initialization
    this.ws = new WebSocket('ws://localhost:4000/locations');

    this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.ws.send('Hello, Server!');
    };

    this.ws.onmessage = (event) => {
      let message = JSON.parse(event.data)
      if (message.type == 'init') {
        this.chats.push(message.data)
        localStorage.setItem('chats', JSON.stringify(this.chats))
      }
      else if (message.type == 'message') {
        this.messages.push(message.data)
        localStorage.setItem('messages', JSON.stringify(this.messages))
      }
      else if (message.type == 'location') {
        const { longitude, heading, latitude } = message.data.location
        const newPoint = { longitude, heading, latitude }
        if (this.points[message.data.from.id]) {
          this.points[message.data.from.id].push(newPoint)
        } 
        else {
          this.points[message.data.from.id] = [newPoint]
        }

        localStorage.setItem('points', JSON.stringify(this.points))
      }
    };

    this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

  }
}
</script>

<style>
  body, html {
    padding: 0;
    margin: 0;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
  }
  .chat {
    height: 200px;
    width: 200px;
    border: 3px solid #4C8BF5;
    border-radius: 10px;
  }
  .chat-list, .container {
    height: 100vh;
    width: 100%;
    box-sizing: border-box;
    padding: 50px;
  }
  .container {
    padding: 0px;
    display: flex;
  }
  .chat-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }
  .chat {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-top: 20px;
  }
  .chat-info {
    margin-top: 5px;
    margin-bottom: 5px;
    margin-left: 20px;
    margin-right: 20px;
  }
  .view-chat-container {
    display: flex;
    justify-content: center;
    width: 100%;
    flex: 1;
    align-items: flex-end;
    box-sizing: border-box;
    padding: 20px;
  }
  .view-chat {
    margin-top: 20px;
    width: 100px;
    height: 30px;
    background: none;
    border-radius: 5px;
    border: 1px solid #333;
  }
  .view-chat:hover {
    background: #eee;
    cursor: pointer;
  }
</style>
