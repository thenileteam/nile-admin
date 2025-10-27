import amqp from "amqplib";
import { dashboardService } from "../services/dashboard.service";




const EXCHANGE_NAME = 'admin_order_events';
const ROUTING_KEY = 'order_updates';

// Consumer (Listener) Logic (Simplified from your provided code):

export const handleOrderEvent = async (event: any) => {
    // The payload now has the correct status and reason passed from the publisher
    const { status, reason, createdAt } = event;

    if (status === "SUCCESS") {
        await dashboardService.updateDashboardStat("orders", new Date(createdAt), 1);
        console.log("SUCCESS: Updated orders count.");

    } else if (status === "FAILURE") { // Explicitly check for FAILURE
        await dashboardService.updateDashboardStat("failed_orders", new Date(createdAt), 1);
        console.log("FAILURE: Updated failed orders count.");

        if (reason) {
            await dashboardService.updateFailedOrderReason(reason, new Date(createdAt), 1);
            console.log(`FAILURE: Updated reason: ${reason}`);
        }
    }
    // Any other status (like 'PENDING' if you add it) would need its own branch
};
async function startListeners() {
    console.log("Starting listeners");

    // Safety checks for environment variables
    if (!process.env.RABBITMQ_URL || !process.env.RABBITMQ_QUEUE) {
        throw new Error("RABBITMQ_URL or RABBITMQ_QUEUE is not set");
    }

    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    // 1. ASSERT THE EXCHANGE (Ensure it exists for the binding)
    await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: false });
    console.log("Exchange asserted");

    // 2. ASSERT THE QUEUE
    const q = await channel.assertQueue(process.env.RABBITMQ_QUEUE, {
        durable: false // Use the same options as the exchange if you want to be consistent
    });
    console.log(`Queue ${q.queue} asserted`);

    // 3. BIND THE QUEUE TO THE EXCHANGE (This is the critical step!)
    channel.bindQueue(
        q.queue,              // The name of the queue we just asserted
        EXCHANGE_NAME,        // The exchange to bind to
        ROUTING_KEY           // The key that connects them
    );
    console.log(`Queue bound to exchange ${EXCHANGE_NAME} with key ${ROUTING_KEY}`);


    channel.consume(q.queue, async (msg: any) => { // Consume from the queue object's name
        if (msg !== null) {
            console.log("Message received", JSON.parse(msg.content.toString()));
            try {
                const event = JSON.parse(msg.content.toString());
                // The event payload needs to match what the publisher sends
                await handleOrderEvent(event);
                channel.ack(msg); // Acknowledge the message once successfully processed
                console.log("Message processed and acknowledged");
            } catch (error) {
                console.error("Error processing message:", error);
                // Optionally nack (negative acknowledge) or reject the message
            }
        }
    }, {
        noAck: false // Set to false to manually acknowledge
    });
    console.log("Consuming messages");
}



export default startListeners;