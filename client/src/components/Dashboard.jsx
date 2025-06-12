import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import "./dashboard.css";

function Dashboard() {
  const [listOfCodes, setListOfCodes] = useState([]);
  const [activeSection, setActiveSection] = useState("editorsection");
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const navigate = useNavigate();

  const [githubFiles, setGithubFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const fetchGithubFiles = async () => {
    try {
      setLoadingFiles(true);
      const token = localStorage.getItem("access_token");
      const username = localStorage.getItem("username");

      const response = await fetch(
        `http://localhost:5000/github/listRepoFiles?owner=${username}&repo=newww`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setGithubFiles(data.files || []);
      toast.success("Fetched GitHub files!");
    } catch (error) {
      console.error("GitHub fetch failed:", error);
      toast.error("Failed to fetch GitHub files");
    } finally {
      setLoadingFiles(false);
    }
  };

  const fullcode = async (codeId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/users/getcode/${codeId}`
      );
      const data = await response.json();

      navigate(`/editor/${codeId}`, {
        state: {
          username,
          codeDetails: data,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const getCodesList = async () => {
    const userId = localStorage.getItem("userId");

    try {
      const response = await fetch(`http://localhost:5000/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch codes");
      }

      const data = await response.json();
      console.log(data);
      setListOfCodes(data);
    } catch (error) {
      console.error("Error fetching codes:", error.message);
    }
  };

  const handleDelete = async (codeId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/users/deletecode/${codeId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete code");
      }

      toast.success("Code deleted successfully");
      // Refresh the list
      getCodesList();
    } catch (error) {
      toast.error("Error deleting code");
      console.error("Delete error:", error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    setUsername("");
    toast.success("Logged out");
    navigate('/')
  };

  useEffect(() => {
    getCodesList();
  }, []);

  const generateRoomId = () => {
    const id = uuid();
    setRoomId(id);
    toast.success("Room ID generated!");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Both Room ID and Username are required");
      return;
    }

    navigate(`/editor/${roomId}`, {
      state: { username },
    });

    toast.success("Joined Room");
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  return (
    <div className="dashboard">
      <div className="menubar">
        <button onClick={() => setActiveSection("editorsection")}>
          Create New Code Session
        </button>
        <button onClick={() => setActiveSection("codelist")}>
          Your programs
        </button>
        <button
          onClick={() => {
            setActiveSection("githubcode");
            fetchGithubFiles();
          }}
        >
          Your Commits
        </button>

        <button onClick={logout}>Logout</button>
      </div>

      <div className="dash">
        {activeSection === "editorsection" && (
          <div className="createEditor" style={{ padding: "20px" }}>
            <h3>Create / Join Room</h3>

            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyUp={handleInputEnter}
              placeholder="Enter Room ID"
              className="form-control mb-2"
            />

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyUp={handleInputEnter}
              placeholder="Enter Username"
              className="form-control mb-2"
            />

            <div className="d-flex gap-2">
              <button className="btn btn-success" onClick={joinRoom}>
                Join Room
              </button>
              <button className="btn btn-warning" onClick={generateRoomId}>
                Generate Room ID
              </button>
            </div>
          </div>
        )}

        {activeSection === "codelist" && (
          <div className="codelist">
            <h3>Your Saved Codes</h3>
            {listOfCodes.length === 0 ? (
              <p className="no-codes">No code snippets found.</p>
            ) : (
              <div className="code-grid">
                {listOfCodes.map((code) => (
                  <div className="code-card" key={code._id}>
                    <h4>{code.title || "Untitled Code"}</h4>
                    <p>
                      <strong>Created:</strong>{" "}
                      {new Date(code.createdAt).toLocaleString()}
                    </p>
                    <p>
                      <strong>Language:</strong>{" "}
                      {code.selectedLanguage || "Not specified"}
                    </p>
                    <div className="card-actions">
                      <button
                        className="open-btn"
                        onClick={() => fullcode(code._id)}
                      >
                        Open
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(code._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === "githubcode" && (
          <div className="githubCode">
            <h3>Your GitHub Commits</h3>
            {/* <button className="btn btn-primary mb-3" onClick={fetchGithubFiles}>
              {loadingFiles ? "Loading..." : "Fetch Files from GitHub"}
            </button> */}

            {githubFiles.length === 0 ? (
              <p>No files found in GitHub repo.</p>
            ) : (
              <ul className="file-list">
                {githubFiles.map((file, idx) => (
                  <li key={idx} className="file-item">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      📄 {file.path}
                    </a>{" "}
                    <span className="text-muted">({file.size} bytes)</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
