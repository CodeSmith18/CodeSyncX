import React, { useEffect, useRef, useState } from "react";
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

// List of supported languages
const LANGUAGES = [
  "python",
  "java",
  "cpp"
];

function EditorPage() {
  const [clients, setClients] = useState([]);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isCompileWindowOpen, setIsCompileWindowOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("cpp");
  const codeRef = useRef(null);
  const [title, setTitle] = useState("");

  const Location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const socketRef = useRef(null);

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

  const handelInput = (e) => {
    setInput(e.target.value);
  };

  const leaveRoom = async () => {
    navigate("/");
  };

  const runCode = async () => {
    setIsCompiling(true);

    try {
      const response = await axios.post(
        `/compile/${selectedLanguage}`,
        {
          code: codeRef.current,
          input: input,
        }
      );

     setOutput(response.data.result?.trim() || "No output");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "An error occurred during code execution.";
      setOutput(errorMessage);
    } finally {
      setIsCompiling(false);
    }
  
  };

  const toggleCompileWindow = () => {
    setIsCompileWindowOpen(!isCompileWindowOpen);
  };
  const uploadToGitHub = async () => {
    try {
      const owner = localStorage.getItem("username")
      const repo = "CodeSync";
      const commitMessage = "Code uploaded from Editor";
      const token = localStorage.getItem("access_token");
        if(!token ) return toast.error("Login with github First");

      const response = await axios.post(
        "/github/uploadFile",
        {
          owner,
          repo,
          content: codeRef.current,
          commitMessage,
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

    const code = codeRef.current;

    const data = { code, input, output, userId, selectedLanguage, title };
    console.log(code);

    try {
      const response = await fetch("/users/uploadCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      toast.success("file saved");
    } catch (error) {
      console.error("Error", error);
    }
  };

  return (
    <div className="main-container">
      <div className="left">
        <div className="client-list">
          <span className="client-header">Members</span>
          {clients.map((client) => (
            <Client key={client.socketId} username={client.username} />
          ))}
        </div>
        <div className="compiler-section">
          <div className="compiler-header">
            <h5>Compiler Output ({selectedLanguage})</h5>
            <button
              className="run-button"
              onClick={runCode}
              disabled={isCompiling}
            >
              {isCompiling ? "Compiling..." : "Run Code"}
            </button>
            <div className="button-group">
              <button className="upload-btn" onClick={uploadToGitHub}>
                Upload to GitHub
              </button>
            </div>
          </div>

          <textarea
            className="compiler-input"
            onChange={handelInput}
            placeholder="Enter Your Input"
          ></textarea>
          <textarea
            className="compiler-output"
            value={output}
            readOnly
          ></textarea>
        </div>
      </div>
      <div className="right">
        <div className="button-group">
          <select
            className="language-dropdown"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <button className="copy-btn" onClick={copyRoomId}>
            Share Room Link
          </button>
          <button className="leave-btn" onClick={leaveRoom}>
            Leave Room
          </button>
          <button className="leave-btn" onClick={saveToDatabase}>
            Save to Database
          </button>
          <button className="leave-btn" onClick={()=>{navigate("/dashboard")}}>
            Dashboard
          </button>
        </div>

      <div className="editor-wrapper">
  <Editor
    socketRef={socketRef}
    roomId={roomId}
    onCodeChange={(code) => {
      codeRef.current = code;
    }}
  />
</div>
      </div>
    </div>
  );
}

export default EditorPage;
