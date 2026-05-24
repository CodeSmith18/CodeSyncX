import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import "./dashboard.css";
import { API_BASE_URL } from "../config";

function Dashboard() {
  const [listOfCodes, setListOfCodes] = useState([]);
  const [activeSection, setActiveSection] = useState("editorsection");
  const [title,setTitle] = useState("");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [githubFiles, setGithubFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();
  const menuRef = useRef();

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchGithubFiles = async () => {
    try {
      setLoadingFiles(true);
      const token = localStorage.getItem("github_access_token");
      const username = localStorage.getItem("username");

      if (!token) {
        toast.error("Please log in with GitHub to fetch commits");
        setGithubFiles([]);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/github/listRepoFiles?owner=${username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch GitHub files");
      }
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
      const response = await fetch(`${API_BASE_URL}/users/getcode/${codeId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to open code");
      }
      navigate(`/editor/${codeId}`, {
        state: { username, codeDetails: data },
      });
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Failed to open code");
    }
  };

  const getCodesList = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setListOfCodes([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to fetch codes");
      const data = await response.json();
      setListOfCodes(data);
    } catch (error) {
      console.error("Error fetching codes:", error.message);
      toast.error("Failed to fetch saved codes");
    }
  };

  const handleDelete = async (codeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/deletecode/${codeId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to delete code");
      toast.success("Code deleted successfully");
      getCodesList();
    } catch (error) {
      toast.error("Error deleting code");
      console.error("Delete error:", error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("github_access_token");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    setUsername("");
    toast.success("Logged out");
    navigate("/");
  };

  useEffect(() => {
    getCodesList();
  }, []);

  const generateRoomId = () => {
    const id = uuid();
    return id;
  };

  const joinRoom = () => {

  const id =  generateRoomId(); 

    if ( !username || !title) {
      toast.error("Program title and username are required");
      return;
    }
    navigate(`/editor/${id}`, { state: { username , title } });
    toast.success("Joined Room");
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") joinRoom();
  };

  const menuItems = [
    { id: "editorsection", label: "Open Editor", meta: "Create a live room" },
    { id: "codelist", label: "Your Programs", meta: `${listOfCodes.length} saved` },
    { id: "githubcode", label: "Your Commits", meta: "GitHub files" },
  ];

  return (
    <div className="dashboard">
      <button className="hamburger" onClick={toggleMenu} aria-label="Open menu">☰</button>

      {menuOpen && <div className="overlay" onClick={closeMenu}></div>}

      <aside className={`menubar ${menuOpen ? "show" : "hide"}`} ref={menuRef}>
        <div className="menu-header">
          <div className="dashboard-brand">
            <span>{"</>"}</span>
            <div>
              <strong>CodeSyncX</strong>
              <small>Workspace</small>
            </div>
          </div>
          <button className="close-btn" onClick={closeMenu} aria-label="Close menu">×</button>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">{(username || "G").slice(0, 1).toUpperCase()}</div>
          <div>
            <span>Signed in as</span>
            <strong>{username || "Guest"}</strong>
          </div>
        </div>

        <nav className="menu-nav" aria-label="Dashboard sections">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={activeSection === item.id ? "active" : ""}
              onClick={() => {
                setActiveSection(item.id);
                if (item.id === "githubcode") fetchGithubFiles();
                closeMenu();
              }}
            >
              <span>{item.label}</span>
              <small>{item.meta}</small>
            </button>
          ))}
        </nav>

        <button
          className="logout-btn"
          onClick={() => {
            logout();
            closeMenu();
          }}
        >
          Logout
        </button>
      </aside>

      <div className="dash">
        <header className="dash-header">
          <div>
            <span className="section-eyebrow">Developer workspace</span>
            <h1>Build, save, and ship collaborative code.</h1>
          </div>
          <div className="dash-stats">
            <div>
              <strong>{listOfCodes.length}</strong>
              <span>Saved programs</span>
            </div>
            <div>
              <strong>{githubFiles.length}</strong>
              <span>GitHub files</span>
            </div>
          </div>
        </header>

        {activeSection === "editorsection" && (
          <section className="createEditor dashboard-panel">
            <div className="panel-copy">
              <span className="section-eyebrow">Live session</span>
              <h2>Create or join a room</h2>
              <p>Start a shared coding space with a generated room URL and your display name.</p>
            </div>

            <div className="room-form">
              <label>
                Program title
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onKeyUp={handleInputEnter} placeholder="API queue demo" className="form-control mb-2" />
              </label>
              <label>
                Display name
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyUp={handleInputEnter} placeholder="Ritik" className="form-control mb-2" />
              </label>
              <div className="room-actions">
                <button className="primary-dashboard-btn" onClick={joinRoom}>Join Room</button>
              </div>
            </div>
          </section>
        )}

        {activeSection === "codelist" && (
          <section className="codelist dashboard-section">
            <div className="section-heading">
              <span className="section-eyebrow">Saved work</span>
              <h2>Your saved codes</h2>
            </div>
            {listOfCodes.length === 0 ? (
              <div className="empty-state">
                <strong>No code snippets found.</strong>
                <span>Create a room and save your code to see it here.</span>
              </div>
            ) : (
              <div className="code-grid">
                {listOfCodes.map((code) => (
                  <div className="code-card" key={code._id}>
                    <h4>{code.title || "Untitled Code"}</h4>
                    <p><span>Created</span> {new Date(code.createdAt).toLocaleString()}</p>
                    <p><span>Language</span> {code.selectedLanguage || "Not specified"}</p>
                    <div className="card-actions">
                      <button className="open-btn" onClick={() => fullcode(code._id)}>Open</button>
                      <button className="delete-btn" onClick={() => handleDelete(code._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === "githubcode" && (
          <section className="githubCode dashboard-section">
            <div className="section-heading">
              <span className="section-eyebrow">GitHub</span>
              <h2>Your GitHub commits</h2>
            </div>
            {githubFiles.length === 0 ? (
              <div className="empty-state">
                <strong>{loadingFiles ? "Loading GitHub files..." : "No files found in GitHub repo."}</strong>
                <span>Use GitHub login and upload from the editor to populate this list.</span>
              </div>
            ) : (
              <ul className="file-list">
                {githubFiles.map((file, idx) => (
                  <li key={idx} className="file-item">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="file-link">
                      {file.path}
                    </a> <span className="text-muted">({file.size} bytes)</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
