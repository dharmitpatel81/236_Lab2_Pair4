// kafkaClient.js
// Shared Kafka setup for producer and consumer
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-system',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

// Producer instance
const producer = kafka.producer();

async function connectProducer() {
  await producer.connect();
}

async function publishOrder(order) {
  await producer.send({
    topic: 'customer-orders',
    messages: [
      { value: JSON.stringify(order) },
    ],
  });
}

// Consumer instance for restaurant
const consumer = kafka.consumer({ groupId: 'restaurant-group' });

async function connectConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'customer-orders', fromBeginning: false });
}

module.exports = {
  producer,
  connectProducer,
  publishOrder,
  consumer,
  connectConsumer,
};
