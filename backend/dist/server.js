"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const initDb_1 = __importDefault(require("./initDb"));
const db_1 = __importDefault(require("./db"));
const queue_1 = require("./queue");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.json({
        message: "ReachBox Email Scheduler API is running!",
    });
});
app.get("/api/emails/scheduled", async (_req, res) => {
    try {
        const result = await db_1.default.query(`
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
    }
    catch (error) {
        console.error("Fetch scheduled emails error:", error);
        res.status(500).json({
            message: "Failed to fetch scheduled emails.",
        });
    }
});
app.post("/api/emails/schedule", async (req, res) => {
    try {
        const { recipients, subject, body, startTime, delay = 1000, hourlyLimit = 100, } = req.body;
        if (!Array.isArray(recipients) ||
            recipients.length === 0 ||
            !subject ||
            !body ||
            !startTime) {
            return res.status(400).json({
                message: "Recipients, subject, body and startTime are required.",
            });
        }
        const scheduledEmails = [];
        for (let i = 0; i < recipients.length; i++) {
            const scheduledAt = new Date(new Date(startTime).getTime() + i * Number(delay));
            const result = await db_1.default.query(`
        INSERT INTO emails
        (recipient, subject, body, scheduled_at, status)
        VALUES ($1, $2, $3, $4, 'SCHEDULED')
        RETURNING id
        `, [
                recipients[i],
                subject,
                body,
                scheduledAt,
            ]);
            const emailId = result.rows[0].id;
            const job = await queue_1.emailQueue.add("send-email", {
                emailId,
                recipient: recipients[i],
                subject,
                body,
                hourlyLimit: Number(hourlyLimit),
            }, {
                jobId: `email-${emailId}`,
                delay: Math.max(0, scheduledAt.getTime() - Date.now()),
                removeOnComplete: false,
                removeOnFail: false,
            });
            await db_1.default.query(`
        UPDATE emails
        SET bull_job_id = $1
        WHERE id = $2
        `, [String(job.id), emailId]);
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
    }
    catch (error) {
        console.error("Scheduling error:", error);
        res.status(500).json({
            message: "Failed to schedule emails.",
        });
    }
});
const PORT = 5000;
const startServer = async () => {
    await (0, initDb_1.default)();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};
startServer();
