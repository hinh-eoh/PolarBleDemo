import mqtt from 'precompiled-mqtt/dist/mqtt.browser';

const client = mqtt.connect('wss://energetic-technologist.cloudmqtt.com', {
  username: 'xhzvbhjd',
  password: 'x_dQCT5b0xOg',
});

// Data must be String
const mqttSendMessage = (channel, data) => client.publish(channel, data);

export {mqttSendMessage};
