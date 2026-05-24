import React, { useCallback, useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import "./EditorPage.css";
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
import {
  useNavigate,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_BASE_URL } from "../config";

// List of supported languages
const LANGUAGES = [
  "python",
  "java",
  "cpp",
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function EditorPage() {
  const [clients, setClients] = useState([]);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("cpp");
  const codeRef = useRef(null);
  const [title, setTitle] = useState("");

  const Location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const initialCode = Location.state?.codeDetails?.code || "";

  const socketRef = useRef(null);

  const handleCodeChange = useCallback((code) => {
    codeRef.current = code;
  }, []);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();

      if (!Location.state) {
        let username = prompt("Please enter your name", "Guest");
        navigate(`/editor/${roomId}`, {
          state: {
            username,
          },
        });
      }

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      const handleErrors = (err) => {
        console.log("Error", err);
        toast.error("Socket connection failed, Try again later");
        navigate("/");
      };
      const username = Location.state?.username || "Guest";
      setTitle(Location.state?.title || "file");
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: username,
      });

      if (Location.state?.codeDetails) {
        codeRef.current = Location.state.codeDetails.code;
        setInput(Location.state.codeDetails.input || "");
        setOutput(Location.state.codeDetails.output || "");
        setSelectedLanguage(
          Location.state.codeDetails.selectedLanguage || "cpp"
        );
      }

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== Location.state?.username) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();

    return () => {
      socketRef.current && socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    };
    // The socket should be initialized once for the current editor room.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!Location.state) {
    return <Navigate to="/" />;
  }

  const copyRoomId = async () => {
    try {
      const currentLink = window.location.href;
      await navigator.clipboard.writeText(currentLink);
      toast.success(`Room Link is Copied`);
    } catch (error) {
      console.log(error);
      toast.error("Unable to copy the room Link");
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
  };

  const leaveRoom = async () => {
    navigate("/");
  };

  const runCode = async () => {
    setIsCompiling(true);
    setOutput("Queued for execution...");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/compile/${selectedLanguage}`,
        {
          code: codeRef.current,
          input: input,
        }
      );

      const { jobId } = response.data;

      if (!jobId) {
        throw new Error("Execution job was not created");
      }

      let result = null;

      for (let attempt = 0; attempt < 30; attempt += 1) {
        await wait(500);
        const statusResponse = await axios.get(
          `${API_BASE_URL}/compile/jobs/${jobId}`
        );
        const job = statusResponse.data.job;

        if (job.status === "completed") {
          result = job.result;
          break;
        }

        if (job.status === "failed") {
          throw new Error(job.failedReason || "Execution failed");
        }

        setOutput(`Execution ${job.status}...`);
      }

      if (!result) {
        throw new Error("Execution timed out while waiting for result");
      }

      const output = result.stdout
        ? result.stdout.trim()
        : result.stderr || JSON.stringify(result);

      setOutput(output);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.result ||
        error.message ||
        "An error occurred during code execution.";
      setOutput(errorMessage);
    } finally {
      setIsCompiling(false);
    }
  };

  const uploadToGitHub = async () => {
    try {
      const owner = localStorage.getItem("username")
      const repo = "CodeSync";
      const commitMessage = "Code uploaded from Editor";
      const token = localStorage.getItem("github_access_token");

      if (!token) {
        toast.error("Please log in with GitHub before uploading");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/github/uploadFile`,
        {
          owner,
          repo,
          content: codeRef.current,
          commitMessage,
          selectedLanguage,
          title,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("File uploaded to GitHub successfully!");
      console.log(response.data);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload file to GitHub");
    }
  };

  const saveToDatabase = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      toast.error("Please log in before saving code");
      return;
    }

    const code = codeRef.current;

    const data = { code, input, output, userId, selectedLanguage, title };
    console.log(code);

    try {
      const response = await fetch(`${API_BASE_URL}/users/uploadCode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save code");
      }
      toast.success("File saved");
    } catch (error) {
      console.error("Error", error);
      toast.error(error.message || "Failed to save code");
    }
  };

  return (
    <main className="main-container">
      <aside className="left">
        <section className="room-panel">
          <div>
            <span className="editor-kicker">Live room</span>
            <h1>{title || "Untitled file"}</h1>
          </div>
          <div className="room-meta">
            <span>Room ID</span>
            <strong>{roomId}</strong>
          </div>
        </section>

        <section className="client-list">
          <div className="client-list-header">
            <span className="client-header">Members</span>
            <strong>{clients.length}</strong>
          </div>
          <div className="client-grid">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </section>

        <section className="compiler-section">
          <div className="compiler-header">
            <div>
              <span className="editor-kicker">Execution queue</span>
              <h2>Compiler output</h2>
            </div>
            <button
              className="run-button"
              onClick={runCode}
              disabled={isCompiling}
            >
              {isCompiling ? "Running..." : "Run Code"}
            </button>
          </div>

          <label className="io-label">
            Input
            <textarea
              className="compiler-input"
              value={input}
              onChange={handleInput}
              placeholder="Enter runtime input"
            ></textarea>
          </label>

          <label className="io-label output-label">
            Output
            <textarea
              className="compiler-output"
              value={output}
              readOnly
              placeholder="Execution result will appear here"
            ></textarea>
          </label>

          <button className="upload-btn" onClick={uploadToGitHub}>
            Upload to GitHub
          </button>
        </section>
      </aside>

      <section className="right">
        <header className="editor-topbar-shell">
          <div className="editor-title-block">
            <span className="editor-kicker">CodeSyncX editor</span>
            <h2>{selectedLanguage.toUpperCase()} workspace</h2>
          </div>

          <div className="button-group">
            <select
              className="language-dropdown"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              aria-label="Select language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>

            <button className="copy-btn" onClick={copyRoomId}>
              Share Room
            </button>
            <button className="save-btn" onClick={saveToDatabase}>
              Save
            </button>
            <button className="dashboard-btn" onClick={() => { navigate("/dashboard"); }}>
              Dashboard
            </button>
            <button className="leave-btn" onClick={leaveRoom}>
              Leave
            </button>
          </div>
        </header>

        <div className="editor-wrapper">
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            initialCode={initialCode}
            onCodeChange={handleCodeChange}
          />
        </div>
      </section>
    </main>
  );
}

export default EditorPage;
