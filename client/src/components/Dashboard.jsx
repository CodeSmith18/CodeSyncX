import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import "./dashboard.css";

function Dashboard() {
  const [listOfCodes, setListOfCodes] = useState([]);
  const [activeSection, setActiveSection] = useState("editorsection");
  const [roomId, setRoomId] = useState("");
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
      const token = localStorage.getItem("access_token");
      if(!token ) return toast.error("Login with github First");
      const username = localStorage.getItem("username");

      const response = await fetch(
        `/github/listRepoFiles?owner=${username}&repo=newww`,
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
      const response = await fetch(`/users/getcode/${codeId}`);
      const data = await response.json();
      navigate(`/editor/${codeId}`, {
        state: { username, codeDetails: data },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const getCodesList = async () => {
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(`/users/${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to fetch codes");
      const data = await response.json();
      setListOfCodes(data);
    } catch (error) {
      console.error("Error fetching codes:", error.message);
    }
  };

  const handleDelete = async (codeId) => {
    try {
      const response = await fetch(`/users/deletecode/${codeId}`, {
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
    localStorage.removeItem("username");
    setUsername("");
    toast.success("Logged out");
    navigate("/");
  };

  useEffect(() => {
    getCodesList();
  }, []);

  const generateRoomId = () => {
    const id = uuid();
    setRoomId(id);
    // toast.success("Room ID generated!");
    return id;
  };

  const joinRoom = () => {

  const id =  generateRoomId(); 

    if ( !username || !title) {
      toast.error("Both Room ID and Username are required");
      return;
    }
    navigate(`/editor/${id}`, { state: { username , title } });
    toast.success("Joined Room");
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") joinRoom();
  };

  return (
    <div className="dashboard">
      <div className="hamburger" onClick={toggleMenu}>☰</div>

      {menuOpen && <div className="overlay" onClick={closeMenu}></div>}
   
    <div className={`menubar ${menuOpen ? "show" : "hide"}`} ref={menuRef}>
  <div className="menu-header">
    <button className="close-btn" onClick={closeMenu}>×</button>
  </div>

 <button > <h3  onClick={()=>{
  navigate('/')
 }} className="tit">🚀CodeSynx</h3> </button>

  <button
    className={activeSection === "editorsection" ? "active" : ""}
    onClick={() => {
      setActiveSection("editorsection");
      closeMenu();
    }}
  >
    Open Editor
  </button>

  <button
    className={activeSection === "codelist" ? "active" : ""}
    onClick={() => {
      setActiveSection("codelist");
      closeMenu();
    }}
  >
    Your programs
  </button>

  <button
    className={activeSection === "githubcode" ? "active" : ""}
    onClick={() => {
      setActiveSection("githubcode");
      fetchGithubFiles();
      closeMenu();
    }}
  >
    Your Commits
  </button>

  <button onClick={() => {
    logout();
    closeMenu();
  }}>
    Logout
  </button>
</div>



      <div className="dash">
        {activeSection === "editorsection" && (
          <div className="createEditor" style={{ padding: "20px" }}>
            <h3>Create / Join Room</h3>
             <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onKeyUp={handleInputEnter} placeholder="Enter Program Title" className="form-control mb-2" />
            {/* <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} onKeyUp={handleInputEnter} placeholder="Enter Room ID" className="form-control mb-2" /> */}
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyUp={handleInputEnter} placeholder="Enter Username" className="form-control mb-2" />
            <div className="d-flex gap-2">
              <button className="btn btn-success" onClick={joinRoom}>Join Room</button>
              {/* <button className="btn btn-warning" onClick={generateRoomId}>Generate Room ID</button> */}
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
                    <p><strong>Created:</strong> {new Date(code.createdAt).toLocaleString()}</p>
                    <p><strong>Language:</strong> {code.selectedLanguage || "Not specified"}</p>
                    <div className="card-actions">
                      <button className="open-btn" onClick={() => fullcode(code._id)}>Open</button>
                      <button className="delete-btn" onClick={() => handleDelete(code._id)}>Delete</button>
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
            {githubFiles.length === 0 ? (
              <p>No files found in GitHub repo.</p>
            ) : (
              <ul className="file-list">
                {githubFiles.map((file, idx) => (
                  <li key={idx} className="file-item">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="file-link">
                      📄 {file.path}
                    </a> <span className="text-muted">({file.size} bytes)</span>
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
