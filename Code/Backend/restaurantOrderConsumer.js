// restaurantOrderConsumer.js
// Kafka consumer for restaurant service: updates MongoDB order status to 'received' when a new order is published

const { consumer, connectConsumer } = require('./kafkaClient');
const mongoose = require('mongoose');
const Order = require('./models/order');

// Export a function to start the restaurant order consumer from the main backend server
async function startRestaurantOrderConsumer() {
  await connectConsumer();
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const orderData = JSON.parse(message.value.toString());
        // Updating the 'new' order to 'received' and fetch updated order
        const updatedOrder = await Order.findByIdAndUpdate(orderData.orderId, { status: 'received' }, { new: true });
        
        // Log the order number and full restaurant address for traceability
        // Note: Address fields are nested under restaurantDetails.address
        const addr = updatedOrder.restaurantDetails.address;
        console.log(
          `Order ${updatedOrder.orderNumber} has been received by ${updatedOrder.restaurantDetails.name} (` +
          `${addr.street}, ${addr.city}, ${addr.state}, ${addr.zipCode}, ${addr.country})`
        );
        // Log the Kafka event data as a single line for easier log parsing
        console.log('Kafka event data:', JSON.stringify(orderData));

      } catch (err) {
        console.error('Error processing Kafka order message:', err);
      }
    },
  });
}

module.exports = { startRestaurantOrderConsumer };
