import { emailQueue } from "./queue";

async function addTestJob() {
  await emailQueue.add("test-email", {
    recipient: "test@example.com",
    subject: "Test Email",
    body: "Hello from ReachBox!",
  });

  console.log("Test email job added to queue!");
}

addTestJob();