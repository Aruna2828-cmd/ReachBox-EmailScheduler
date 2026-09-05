"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queue_1 = require("./queue");
async function addTestJob() {
    await queue_1.emailQueue.add("test-email", {
        recipient: "test@example.com",
        subject: "Test Email",
        body: "Hello from ReachBox!",
    });
    console.log("Test email job added to queue!");
}
addTestJob();
