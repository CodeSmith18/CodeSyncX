import React from "react";
import "./landing.css";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

const featureCards = [
  {
    eyebrow: "Live rooms",
    title: "Pair programming that feels instant",
    copy:
      "Create a room, invite collaborators, and keep everyone aligned in the same editor session.",
  },
  {
    eyebrow: "Execution",
    title: "Run code from the browser",
    copy:
      "Queue-based execution supports Python, C++, and Java with clear input and output panels.",
  },
  {
    eyebrow: "Workflow",
    title: "Built for real project demos",
    copy:
      "GitHub login, repository upload flow, shared rooms, and system-design infrastructure in one app.",
  },
];

function LandingPage() {
  const navigate = useNavigate();

  const handleGitHubLogin = () => {
    navigate("/login");
  };

  const openLiveEditor = () => {
    const id = uuid();
    navigate(`/editor/${id}`);
  };

  return (
    <main className="landing-shell">
      <div className="landing-bg" aria-hidden="true">
        <div className="grid-layer" />
        <div className="scan-line" />
      </div>

      <nav className="landing-nav" aria-label="CodeSyncX">
        <button className="brand-mark" onClick={() => navigate("/")}>
          <span className="brand-icon">{"</>"}</span>
          <span>CodeSyncX</span>
        </button>
        <div className="nav-actions">
          <button className="ghost-link" onClick={handleGitHubLogin}>
            Sign in
          </button>
          <button className="nav-cta" onClick={openLiveEditor}>
            Start room
          </button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="status-pill">
            <span className="pulse-dot" />
            Real-time collaborative code workspace
          </div>
          <h1>Code together, execute safely, ship the demo faster.</h1>
          <p>
            CodeSyncX combines shared editing, GitHub authentication, and queued
            code execution into one polished developer collaboration experience.
          </p>

          <div className="hero-actions">
            <button className="primary-action" onClick={openLiveEditor}>
              Try live editor
            </button>
            <button className="secondary-action" onClick={handleGitHubLogin}>
              Continue with GitHub
            </button>
          </div>

          <div className="hero-metrics" aria-label="Project highlights">
            <div>
              <strong>3</strong>
              <span>Languages</span>
            </div>
            <div>
              <strong>Redis</strong>
              <span>Execution queue</span>
            </div>
            <div>
              <strong>Docker</strong>
              <span>Sandbox-ready</span>
            </div>
          </div>
        </div>

        <div className="product-stage" aria-label="CodeSyncX editor preview">
          <div className="editor-card">
            <div className="editor-topbar">
              <div className="window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span className="room-chip">room: sprint-review</span>
              <span className="sync-chip">Synced</span>
            </div>

            <div className="editor-body">
              <aside className="file-rail" aria-label="Project files preview">
                <span className="file active">main.py</span>
                <span className="file">queue.js</span>
                <span className="file">socket.js</span>
              </aside>

              <div className="code-panel">
                <div className="code-row">
                  <span>01</span>
                  <code>def run_job(language, source):</code>
                </div>
                <div className="code-row">
                  <span>02</span>
                  <code>    job = queue.add(language, source)</code>
                </div>
                <div className="code-row active-line">
                  <span>03</span>
                  <code>    return sandbox.execute(job)</code>
                </div>
                <div className="code-row">
                  <span>04</span>
                  <code />
                </div>
                <div className="code-row">
                  <span>05</span>
                  <code>print("CodeSyncX is live")</code>
                </div>
              </div>
            </div>

            <div className="collab-strip">
              <div className="avatar-stack" aria-label="Active collaborators">
                <span>R</span>
                <span>A</span>
                <span>S</span>
              </div>
              <div className="terminal-preview">
                <span>$ python main.py</span>
                <strong>CodeSyncX is live</strong>
              </div>
            </div>
          </div>

          <div className="floating-card queue-card">
            <span>Queue</span>
            <strong>Job completed in 842ms</strong>
          </div>
          <div className="floating-card socket-card">
            <span>Socket</span>
            <strong>3 users editing</strong>
          </div>
        </div>
      </section>

      <section className="feature-section" aria-label="CodeSyncX features">
        {featureCards.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <span>{feature.eyebrow}</span>
            <h2>{feature.title}</h2>
            <p>{feature.copy}</p>
          </article>
        ))}
      </section>

      <section className="workflow-band" aria-label="CodeSyncX workflow">
        <div>
          <span className="section-kicker">How it flows</span>
          <h2>Open a room, collaborate live, execute through the queue.</h2>
        </div>
        <div className="workflow-steps">
          <span>Create room</span>
          <span>Share link</span>
          <span>Run code</span>
          <span>Upload to GitHub</span>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
