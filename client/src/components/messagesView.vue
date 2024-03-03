<template>
    <div id="messagesview">
        <div class="toolbar">
            <!--<button class="icon-btn">
                <img src="@/assets/filter-variant.svg" height="25px" width="25px"/>
                <span class="tooltip">
                    Filtro
                </span>
            </button>-->
            <button @click="sequenceDiagram=!sequenceDiagram" class="icon-btn">
                <img src="@/assets/abacus.svg" height="25px" width="25px" v-if="!sequenceDiagram"/>
                <img src="@/assets/message-text-outline.svg" height="25px" width="25px" v-else/>
                <span class="tooltip" v-if="!sequenceDiagram">
                    Secuencia
                </span>
                <span class="tooltip" v-else>
                    Normal
                </span>
            </button>
            <!--<button class="icon-btn">
                <img src="@/assets/shield-star-outline.svg" height="25px" width="25px"/>
                <span class="tooltip">
                    Rango
                </span>
            </button>-->
            <!--<button class="icon-btn">
                <img src="@/assets/send-outline.svg" height="25px" width="25px"/>
                <span class="tooltip">
                    Escribir
                </span>
            </button>-->
            <!--<button class="icon-btn">
                <img src="@/assets/tag-check-outline.svg" height="25px" width="25px"/>
                <span class="tooltip" v-if="!currentRole">
                    Rol
                </span>
                <span class="tooltip" style="color: red; border: 1px solid red; padding: 2px 4px 2px 4px; border-radius: 3px; bottom: -28px;" v-else>
                    {{ currentRole }}
                </span>
            </button>-->
            <button class="icon-btn" @click="showSince=!showSince">
                <img src="@/assets/timeline-clock-outline.svg" height="25px" width="25px"/>
                <span class="tooltip" v-if="!showSince">
                    Desde
                </span>
                <div id="since" v-if="showSince" @click="setSince">
                    <input v-model="since" type="number">min
                </div>
            </button>
        </div>
        <div id="message">
            <p>Destinatario</p><input>
            <p>Mensaje</p><textarea id="textarea"></textarea>
        </div>
        <div v-if="messages.length">
            <div v-if="!sequenceDiagram">
                <div class="message" v-for="(message, i) in sinceMessages(messages)" :key="i">
                    <div class="message-text" v-if="message.text">
                        <span class="message-author">
                            {{ message.from.first_name }}
                        </span>
                        <div class="message-contents">
                            {{ message.text }} 
                        </div>
                        <span class="message-timestamp">
                            {{ extractTimeFromInteger(message.date) }}
                        </span>
                    </div>
                    <div class="message-photo" v-if="message.src">
                        <img :src="message.src"/>
                    </div>
                </div>
            </div>
            <div style="display: flex; justify-content: center; padding-top: 20px;" v-else>
                <br><br>
                <vue-mermaid-string :value="chart" :options="mermaidOptions"/>
            </div>
        </div>
    </div>
</template>

<script>
    import VueMermaidString from 'vue-mermaid-string'
    export default {
        name: 'messagesView',
        components: {
            VueMermaidString
        },
        props: {
            messages: {
                required: true,
                type: Array,
            }
        },
        data: () => ({
            showSince: true,
            sequenceDiagram: false,
            mermaidOptions: {
                theme: "forest",
                gantt: {
                    axisFormat: "%H:%M",
                    dateFormat: "%Y-%m-%d"
                },
                flowchart: {
                    useMaxWidth: true,
                },
                sequence: {
                    useMaxWidth: false,
                    diagramPadding: {
                        top: 10,
                        right: 10,
                        bottom: 10,
                        left: 10
                    },
                    direction: "TB",
                    actorMargin: 50
                }
            },
            currentRole: null,
            since: null,
            chart: "",
        }),
        methods: {
            setChart() {
                let messages = this.sinceMessages(this.messages)
                console.log(messages.length)
                this.chart = this.messagesToFlowchart(messages)
            },
            setSince(event) {
                event.stopPropagation()
                this.since = null
            },
            extractTimeFromInteger(dateInteger) {
                let timestampMilliseconds = dateInteger * 1000;

                let date = new Date(timestampMilliseconds);

                let hours = ('0' + date.getHours()).slice(-2);
                let minutes = ('0' + date.getMinutes()).slice(-2);
                
                return hours + ':' + minutes;
            },
            messagesToSequence(messages) {
                let mermaidCode = 'sequenceDiagram\n';
                messages.forEach((msg, index) => {
                    mermaidCode += `    participant ${msg.from.replace(' ', '_')} as ${msg.from} (${msg.role})\n`;
                    if (index > 0) {
                    mermaidCode += `    ${messages[index - 1].from.replace(' ', '_')} ->> ${msg.from.replace(' ', '_')}: ${messages[index - 1].message}\n`;
                    }
                });
                return mermaidCode;
            },
            messagesToFlowchart(messages) {
                if (messages.length) {
                    let mermaidCode = 'graph TD\n';
                    messages.forEach(msg => {
                        mermaidCode += `    ${msg.message_id}["${msg.text}(${msg.from.first_name})"]\n`;
                    });

                    messages.forEach(msg => {
                        if (msg.reply_to_message) {
                            const replyMsg = messages.find(m => m.message_id === msg.reply_to_message.message_id);
                            mermaidCode += `    ${msg.message_id} -.->|${msg.text}| ${replyMsg.message_id}\n`;
                        }
                    });

                    for (let i = 1; i < messages.length; i++) {
                        mermaidCode += `    ${messages[i - 1].message_id} --> ${messages[i].message_id}\n`;
                    }

                    return mermaidCode;
                }
                else {
                    return ""
                }
            },
            sinceMessages(messages) {
                if (typeof this.since ==  'number') {
                    let currentTimeMilliseconds = Date.now();
                    let currentTimeSeconds = Math.floor(currentTimeMilliseconds / 1000);
                    return messages.filter(message => (currentTimeSeconds-message.date)>=(parseInt(this.since)*60))
                }
                else {
                    return messages
                }
            }

        },
        computed: {
            filterRoleMessages() {
                if (this.currentRole) {
                    return this.messages.filter(message => message.role ==this.currentRole)
                }
                else {
                    return this.messages
                }
            },
        },
        watch: {
            since() {
                this.setChart()
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
        padding-top: 80px;
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
    .message-photo {
        border-radius: 8px;
        box-shadow: 1px 1px 3px 0px #3e5a22;
        overflow: hidden;
        height: 400px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .message-photo img {
        object-fit: contain;
        height: 100%;
    }
    #since {
        display: flex;
        gap: 10px;
        position: absolute;
        justify-content: center;
        align-items: center;
        transform: translateY(100%);
        bottom: -5px;
        background: white;
    }
    #since input {
        width: 50px;
        margin: 0px;
    }
    .message-text {
        background: #efffdf;
        border-radius: 10px;
        padding: 4px;
        position: relative;
    }
    .message-text > span {
        background-color: transparent !important;
    }
    .message-contents {
        padding: 2px 0px 8px 10px;
    }
    .message-author {
        font-size: 12px;
        color: #777;
        padding-left: 10px;
        margin-bottom: 0px;
        padding-top: 6px;
    }
    .message-role {
        position: absolute;
        right: 10px;
        top: 6px;
        font-size: 12px;
        color: rgb(250, 88, 88);
    }
    .message-timestamp {
        font-size: 10px;
        color: #777;
        margin-top: 5px;
        margin-bottom: 3px;
        min-width: calc(100%);
        text-align: end;
        position: absolute;
        bottom: 3px;
        right: 5px;
    }
    .toolbar {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        padding: 10px;
        padding-bottom: 24px;
        position: absolute;
        box-sizing: border-box;
        width: 50%;
        top: 0px;
        background: rgba(255, 255, 255, .9);
        z-index: 2;
    }
    .text-btn, .icon-btn {
        position: relative;
    }
    .tooltip {
        position: absolute;
        bottom: -23px;
        left: 50%;
        min-width: 40px;
        transform: translateX(-50%)
    }
    .text-btn {
        color: #3e5a22;
        background: transparent;
        border: 1px solid #3e5a22;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 5px 3px 5px 3px;
        border-radius: 3px;
    }
    .icon-btn {
        color: #3e5a22;
        background: rgba(62, 90, 34, .1);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 8px;
        border-radius: 50%;
        border: none;
        aspect-ratio: 1;
        position: relative;
    }
    #message {
        position: absolute;
        z-index: 2;
        background: white;
        display: flex;
        flex-direction: column;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px;
        border: 2px solid #3e5a22;
        border-radius: 8px;
        width: 200px;
        display: none;
    }
    p {
        margin: 0px;
        font-size: 14px;
    }
    input {
        margin-top: 8px;
        border-radius: 3px;
        outline: none;
        border: 1px solid #999;
        margin-bottom: 15px;
    }
    #textarea {
        margin-top: 8px;
        border: 1px solid #999;
        resize: none;
        margin-bottom: 8px;
        border-radius: 3px;
        height: 100px;
        font-family: Verdana, Geneva, Tahoma, sans-serif;
    }
</style>
  