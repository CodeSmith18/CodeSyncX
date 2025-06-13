import React, { useState } from "react";
import "./landing.css";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid"

function LandingPage() {
  const [code, setCode] = useState("");
    const navigate = useNavigate();

  const handleGitHubLogin = () => {
    navigate("/login")
  }

  return (
    <div className="landing">
      {/* Background Animation */}
      <svg
        className="background-svg"
        viewBox="0 0 800 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4facfe" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>
        </defs>
        <path
          d="M 0 300 Q 200 100 400 300 T 800 300 V 400 H 0 Z"
          fill="url(#grad)"
        >
          <animate
            attributeName="d"
            dur="10s"
            repeatCount="indefinite"
            values="
              M 0 300 Q 200 100 400 300 T 800 300 V 400 H 0 Z;
              M 0 280 Q 220 140 400 250 T 800 260 V 400 H 0 Z;
              M 0 300 Q 200 100 400 300 T 800 300 V 400 H 0 Z
            "
          />
        </path>
      </svg>

      {/* Hero */}
      <div className="hero">
        <h1 className="title">🚀 CodeSynx</h1>
        <p className="tagline">Collaborate. Code. Connect.</p>
        <p className="subtitle">
          Real-time collaborative code editor with GitHub integration.
        </p>
        <div className="buttonsl">
          <button className="btn primary" onClick={()=>{
            const id = uuid();
            navigate(`/editor/${id}`);
          }}>🧪 Try Live Editor</button>
          <button className="btn secondary" onClick={handleGitHubLogin}>
             Login  / SignUp
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="features">
        <div className="feature glass">
          <h2>👥 Real-Time Collaboration</h2>
          <p>
            Write code together in sync – just like Google Docs for developers.
          </p>
        </div>
        <div className="feature glass">
          <h2>🌐 GitHub Upload</h2>
          <p>Push your code directly to any of your GitHub repos.</p>
        </div>
        <div className="feature glass">
          <h2>💻 Multi-Language Support</h2>
          <p>JS, Python, C++, Java – all in one playground.</p>
        </div>
      </div>

      {/* Simple Editor */}
      {/* Editor Preview */}
    {/* Editor Preview */}
<div className="editor-preview">
  <h2>📝 Collaborative Code Editor (Preview)</h2>

  {/* Fake Collaborative Header */}
  <div className="editor-header">
    <div className="avatars">
      <img src="https://i.pravatar.cc/30?img=1" alt="User1" title="ritik_raj" />
      <img src="https://i.pravatar.cc/30?img=2" alt="User2" title="ashwini_js" />
    </div>
    <span className="editing-label">Editing together...</span>
  </div>

  {/* Code Editor */}
  <textarea
    className="mock-code-editor"
    value={`function sum(a, b) {\n  return a + b;\n}\n\nconsole.log(sum(3, 5));`}
    readOnly
  ></textarea>

  {/* Input Area */}
  <div className="mock-io">
    <div className="mock-input">
      <label>🧾 Input:</label>
      <textarea placeholder="e.g., 3 5" readOnly>3 5</textarea>
    </div>
    <div className="mock-output">
      <label>📤 Output:</label>
      <div className="output-box">8</div>
    </div>
  </div>
</div>


      <footer className="footer">
        © {new Date().getFullYear()} <strong>CodeSynx</strong>. Built with ❤️
        and caffeine.
      </footer>
    </div>
  );
}

export default LandingPage;
