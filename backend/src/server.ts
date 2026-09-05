import express from "express";
import cors from "cors";
import initDb from "./initDb";
import pool from "./db";
import { emailQueue } from "./queue";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "ReachBox Email Scheduler API is running!",
  });
});

app.get("/api/emails/scheduled", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id: number;
        recipient: string;
        subject: string;
        sent_at: string;
        scheduled_at: string;
        status: "SENT"|"FAILED";
      FROM emails
      WHERE status = 'SCHEDULED'
      ORDER BY scheduled_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch scheduled emails error:", error);

    res.status(500).json({
      message: "Failed to fetch scheduled emails.",
    });
  }
});

app.post("/api/emails/schedule", async (req, res) => {
  try {
    const {
      recipients,
      subject,
      body,
      startTime,
      delay = 1000,
      hourlyLimit = 100,
    } = req.body;

    if (
      !Array.isArray(recipients) ||
      recipients.length === 0 ||
      !subject ||
      !body ||
      !startTime
    ) {
      return res.status(400).json({
        message: "Recipients, subject, body and startTime are required.",
      });
    }

    const scheduledEmails = [];

    for (let i = 0; i < recipients.length; i++) {
      const scheduledAt = new Date(
        new Date(startTime).getTime() + i * Number(delay)
      );

      const result = await pool.query(
        `
        INSERT INTO emails
        (recipient, subject, body, scheduled_at, status)
        VALUES ($1, $2, $3, $4, 'SCHEDULED')
        RETURNING id
        `,
        [
          recipients[i],
          subject,
          body,
          scheduledAt,
        ]
      );

      const emailId = result.rows[0].id;

      const job = await emailQueue.add(
        "send-email",
        {
          emailId,
          recipient: recipients[i],
          subject,
          body,
          hourlyLimit: Number(hourlyLimit),
        },
        {
          jobId: `email-${emailId}`,
          delay: Math.max(0, scheduledAt.getTime() - Date.now()),
          removeOnComplete: false,
          removeOnFail: false,
        }
      );

      await pool.query(
        `
        UPDATE emails
        SET bull_job_id = $1
        WHERE id = $2
        `,
        [String(job.id), emailId]
      );

      scheduledEmails.push({
        id: emailId,
        recipient: recipients[i],
        scheduledAt,
        status: "SCHEDULED",
      });
    }

    res.status(201).json({
      message: `${scheduledEmails.length} email(s) scheduled successfully.`,
      emails: scheduledEmails,
    });
  } catch (error) {
    console.error("Scheduling error:", error);

    res.status(500).json({
      message: "Failed to schedule emails.",
    });
  }
});

const PORT = 5000;

const startServer = async () => {
  await initDb();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();