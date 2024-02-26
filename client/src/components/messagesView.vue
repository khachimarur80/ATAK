<template>
    <div id="messagesview">
        <div class="message" v-for="(message, i) in messages" :key="i">
            {{ message.from.first_name }} : {{ message.text }} 
        </div>
    </div>
</template>

<script>
    export default {
        name: 'messagesView',
        props: {
            messages: {
                required: true,
                type: Array,
            }
        }
    }
</script>

<style scoped>
    #messagesview {
        height: 100%;
        width: 50%;
        padding-bottom: 20px;
        overflow-y: scroll;
        box-sizing: border-box;
    }
    ::-webkit-scrollbar {
        display: none;
    }
    .message {
        width: calc(100% - 30px);
        margin-left: 15px;
        margin-right: 15px;
        margin-bottom: 10px;
        margin-top: 10px;
    }
</style>
  