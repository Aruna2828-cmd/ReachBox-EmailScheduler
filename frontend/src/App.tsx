import { useEffect, useState } from "react";
import "./App.css";

type Email = {
  id: number;
  recipient: string;
  subject: string;
  scheduledAt: string;
  status: "SCHEDULED" | "SENT" | "FAILED";
};

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("compose");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [delay, setDelay] = useState(1000);
  const [hourlyLimit, setHourlyLimit] = useState(100);

  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [search, setSearch] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Fetch scheduled emails from backend
  useEffect(() => {
    if (!loggedIn) return;

    const fetchScheduledEmails = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/emails/scheduled"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch scheduled emails.");
        }

        const data = await response.json();

        const emails: Email[] = data.map(
          (email: {
            id: number;
            recipient: string;
            subject: string;
            scheduled_at: string;
            status: "SCHEDULED" | "SENT" | "FAILED";
          }) => ({
            id: email.id,
            recipient: email.recipient,
            subject: email.subject,
            scheduledAt: new Date(
              email.scheduled_at
            ).toLocaleString(),
            status: email.status,
          })
        );

        setScheduledEmails(emails);
      } catch (error) {
        console.error(
          "Fetch scheduled emails error:",
          error
        );
      }
    };

    fetchScheduledEmails();
  }, [loggedIn]);

  // Upload recipient list
  const uploadRecipients = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result);

      const emails = text
        .split(/[\s,;\n]+/)
        .map((email) => email.trim())
        .filter(
          (email) =>
            email.length > 3 &&
            email.includes("@") &&
            email.includes(".")
        );

      setRecipients([...new Set(emails)]);
    };

    reader.readAsText(file);
  };

  // Schedule emails
  const scheduleEmails = async () => {
    if (
      !subject.trim() ||
      !body.trim() ||
      !startTime ||
      recipients.length === 0
    ) {
      alert("Please fill all required fields.");
      return;
    }

    setIsScheduling(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/emails/schedule",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipients,
            subject,
            body,
            startTime,
            delay,
            hourlyLimit,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to schedule emails."
        );
      }

      const emails: Email[] = (data.emails || []).map(
        (email: {
          id: number;
          recipient: string;
          scheduledAt: string;
          status: "SCHEDULED" | "SENT" | "FAILED";
        }) => ({
          id: email.id,
          recipient: email.recipient,
          subject,
          scheduledAt: new Date(
            email.scheduledAt
          ).toLocaleString(),
          status: email.status,
        })
      );

      setScheduledEmails((previous) => [
        ...previous,
        ...emails,
      ]);

      alert(
        data.message ||
          `${emails.length} emails scheduled successfully.`
      );

      setSubject("");
      setBody("");
      setRecipients([]);
      setStartTime("");
    } catch (error) {
      console.error("Schedule error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to schedule emails."
      );
    } finally {
      setIsScheduling(false);
    }
  };

  const filteredScheduled = scheduledEmails.filter(
    (email) =>
      email.recipient
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      email.subject
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const filteredSent = sentEmails.filter(
    (email) =>
      email.recipient
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      email.subject
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  // Login page
  if (!loggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand">ReachInbox</div>

          <h1>Welcome back</h1>

          <p>
            Schedule and manage your emails with ease.
          </p>

          <button
            className="google-button"
            onClick={() => setLoggedIn(true)}
          >
            <span>G</span>
            Continue with Google
          </button>

          <div className="login-note">
            Secure authentication for your email scheduler
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand sidebar-brand">
          ReachInbox
        </div>

        <div className="sidebar-menu">
          <button
            className={
              page === "compose"
                ? "menu active"
                : "menu"
            }
            onClick={() => setPage("compose")}
          >
            <span>✉</span>
            Compose Email
          </button>

          <button
            className={
              page === "scheduled"
                ? "menu active"
                : "menu"
            }
            onClick={() => setPage("scheduled")}
          >
            <span>◷</span>
            Scheduled Emails
          </button>

          <button
            className={
              page === "sent"
                ? "menu active"
                : "menu"
            }
            onClick={() => setPage("sent")}
          >
            <span>✓</span>
            Sent Emails
          </button>

          <button
            className={
              page === "slack"
                ? "menu active"
                : "menu"
            }
            onClick={() => setPage("slack")}
          >
            <span>◉</span>
            Slack
          </button>
        </div>

        <div className="sidebar-bottom">
          <button className="menu">
            <span>⚙</span>
            Settings
          </button>

          <button
            className="menu"
            onClick={() => setLoggedIn(false)}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        {/* HEADER */}
        <header className="topbar">
          <div>
            <h1>
              {page === "compose" && "Compose New Email"}
              {page === "scheduled" && "Scheduled Emails"}
              {page === "sent" && "Sent Emails"}
              {page === "slack" && "Slack Integration"}
            </h1>

            <p>
              Manage your email campaigns and schedules
            </p>
          </div>

          <div className="user">
            <div className="avatar">D</div>

            <div>
              <strong>Demo User</strong>
              <small>demo@example.com</small>
            </div>
          </div>
        </header>

        {/* COMPOSE */}
        {page === "compose" && (
          <section className="content">
            <div className="form-card">
              <div className="card-heading">
                <h2>Compose Email</h2>

                <span className="required">
                  * Required fields
                </span>
              </div>

              <label>Recipients</label>

              <div className="upload-area">
                <div className="upload-icon">↑</div>

                <strong>Upload recipient list</strong>

                <p>
                  Upload a CSV or TXT file containing email
                  addresses
                </p>

                <label
                  className="upload-button"
                  htmlFor="recipient-file"
                >
                  Choose File
                </label>

                <input
                  id="recipient-file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={uploadRecipients}
                  style={{ display: "none" }}
                />
              </div>

              <div className="recipient-info">
                <strong>{recipients.length}</strong>{" "}
                email addresses detected
              </div>

              {recipients.length > 0 && (
                <div className="chips">
                  {recipients
                    .slice(0, 8)
                    .map((email) => (
                      <span key={email}>
                        {email}
                      </span>
                    ))}

                  {recipients.length > 8 && (
                    <span>
                      +{recipients.length - 8} more
                    </span>
                  )}
                </div>
              )}

              <label>Subject</label>

              <input
                className="input"
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                placeholder="Enter email subject"
              />

              <label>Email Body</label>

              <textarea
                className="textarea"
                value={body}
                onChange={(e) =>
                  setBody(e.target.value)
                }
                placeholder="Write your email message..."
              />

              <div className="settings-grid">
                <div>
                  <label>Start Time</label>

                  <input
                    className="input"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) =>
                      setStartTime(e.target.value)
                    }
                  />
                </div>

                <div>
                  <label>Delay Between Emails</label>

                  <div className="input-with-unit">
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={delay}
                      onChange={(e) =>
                        setDelay(
                          Number(e.target.value)
                        )
                      }
                    />

                    <span>ms</span>
                  </div>
                </div>

                <div>
                  <label>Hourly Email Limit</label>

                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={hourlyLimit}
                    onChange={(e) =>
                      setHourlyLimit(
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <div className="limit-box">
                <strong>Rate limit:</strong>{" "}
                Maximum {hourlyLimit} emails can be sent
                per hour. Emails exceeding the limit will be
                delayed automatically.
              </div>

              <button
                className="schedule-button"
                onClick={scheduleEmails}
                disabled={isScheduling}
              >
                {isScheduling
                  ? "Scheduling..."
                  : "Schedule Emails"}
              </button>
            </div>
          </section>
        )}

        {/* SCHEDULED */}
        {page === "scheduled" && (
          <section className="content">
            <div className="table-card">
              <div className="table-header">
                <div>
                  <h2>Scheduled Emails</h2>

                  <p>
                    {scheduledEmails.length} emails
                    scheduled
                  </p>
                </div>

                <input
                  className="search"
                  placeholder="Search emails..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>

              {filteredScheduled.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">✉</div>

                  <h3>No scheduled emails</h3>

                  <p>
                    Your scheduled emails will appear here.
                  </p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Scheduled Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredScheduled.map((email) => (
                      <tr key={email.id}>
                        <td>{email.recipient}</td>

                        <td>{email.subject}</td>

                        <td>{email.scheduledAt}</td>

                        <td>
                          <span className="status scheduled">
                            {email.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* SENT */}
        {page === "sent" && (
          <section className="content">
            <div className="table-card">
              <div className="table-header">
                <div>
                  <h2>Sent Emails</h2>

                  <p>
                    {sentEmails.length} emails sent
                  </p>
                </div>

                <input
                  className="search"
                  placeholder="Search emails..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>

              {filteredSent.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">✓</div>

                  <h3>No sent emails</h3>

                  <p>
                    Successfully sent emails will appear
                    here.
                  </p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Sent Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSent.map((email) => (
                      <tr key={email.id}>
                        <td>{email.recipient}</td>

                        <td>{email.subject}</td>

                        <td>{email.scheduledAt}</td>

                        <td>
                          <span className="status sent">
                            {email.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* SLACK */}
        {page === "slack" && (
          <section className="content">
            <div className="form-card slack-card">
              <div className="slack-logo">#</div>

              <h2>Connect Slack</h2>

              <p>
                Connect your Slack workspace to receive
                notifications when your hourly email limit
                is reached.
              </p>

              <button className="slack-button">
                Connect Slack
              </button>

              <div className="slack-note">
                You can connect or disconnect Slack at any
                time.
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;