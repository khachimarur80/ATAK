<template>
  <div id="navbar">
    <div class="navbar-title">
      InforMission
    </div>
    <div style="flex: 1">
    </div>
    <button @click="this.$emit('chatsInterface')" v-if="currentChat" class="text-btn">
      Ver chats
    </button>
    <button @click="downloadMarkdownFile"  v-if="currentChat" class="text-btn">
      Descargar
    </button>
  </div>
</template>

<script>
export default {
  name: 'navBar',
  methods: {},
  props: {
    currentChat: {
      required: true,
    }
  }
}
</script>

<style scoped>
  #navbar {
    height: 80px;
    background: #244800;
    display: flex;
    align-items: center;
    font-size: 24px;
    padding-right: 20px;
  }
  .navbar-title {
    color: white;
    margin-left: 30px;
    margin-right: 50px;
  }
  .icon-btn {
    border-radius: 50%;
    height: 40px;
    width: 40px;
    border: none;
    background: none;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background .3s ease-out;
  }
  .icon-btn:hover {
    background: #3e6516;
    cursor: pointer;
  }
  .text-btn {
    border-radius: 8px;
    height: 40px;
    width: 120px;
    border: none;
    background: none;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background .3s ease-out;
    font-size: 18px;
    color: white;
    border: 1px solid white;
    margin-right: 20px;
  }
  .text-btn:hover {
    background: #3e6516;
    cursor: pointer;
  }
</style>
