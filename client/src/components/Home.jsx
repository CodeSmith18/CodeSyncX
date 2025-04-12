import React, { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const CLIENT_ID = "Ov23lixwco48McIOnHs2";
  const [rerender, setRerender] = useState(false);

  function login() {
    window.location.assign(
      "https://github.com/login/oauth/authorize?client_id=" +
        CLIENT_ID +
        "&scope=repo"
    );
  }
  

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const codeParam = urlParams.get("code");
    console.log(codeParam);

    if (codeParam && localStorage.getItem("access_token") === null) {
      async function getAccessToken() {
        try {
          const response = await fetch(
            `http://localhost:5000/github/getAccessToken?code=${codeParam}`,
            {
              method: "GET",
            }
          );
          const data = await response.json(); // Parse response as JSON
          console.log(data);
          if (data.access_token) {
            console.log(data.access_token);
            localStorage.setItem("access_token", data.access_token);
            setRerender(!rerender); // Trigger re-render
          }
        } catch (error) {
          console.error("Error fetching access token:", error); // Log fetch error
        }
      }
      getAccessToken();
    }
  }, [rerender]);

  const navigate = useNavigate();

  async function getUserData() {
    await fetch("http://localhost:5000/github/getUserData", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("access_token"), // Add a space after 'Bearer'
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        
        console.log(data.login);
        console.log(data);
         localStorage.setItem("username", data.login);
        // console.log(data);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }

  const generateRoomId = (e) => {
    e.preventDefault();
    const Id = uuid();
    setRoomId(Id);
    toast.success("Room Id is generated");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Both the field is required");
      return;
    }

    
    navigate(`/editor/${roomId}`, {
      state: {
        username,
      },
    });
    toast.success("Room is created");
  };


  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    toast.success("Logged out successfully");
    setRerender(!rerender);
   
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-12 col-md-6">
          <div className="card shadow-sm p-2 mb-5 bg-secondary rounded">
            <div className="card-body text-center bg-dark">
              <img
                src="/images/codecast.png"
                alt="Logo"
                className="img-fluid mx-auto d-block"
                style={{ maxWidth: "150px" }}
              />
              <h4 className="card-title text-light mb-4">Enter the ROOM ID</h4>

              <div className="form-group">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="form-control mb-2"
                  placeholder="ROOM ID"
                  onKeyUp={handleInputEnter}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-control mb-2"
                  placeholder="USERNAME"
                  onKeyUp={handleInputEnter}
                />
              </div>
              <button
                onClick={joinRoom}
                className="btn btn-success btn-lg btn-block"
              >
                JOIN
              </button>
              <p className="mt-3 text-light">
                Don't have a room ID? create{" "}
                <span
                  onClick={generateRoomId}
                  className=" text-success p-2"
                  style={{ cursor: "pointer" }}
                >
                  {" "}
                  New Room
                </span>
              </p>
              {localStorage.getItem("access_token") && (
                <button onClick={getUserData}>get user data</button>
              )}
              {/* Logout Button */}

              {localStorage.getItem("access_token") ? (
                <>
                  <button
                    onClick={logout}
                    className="btn btn-danger btn-lg mt-3"
                  >
                    Logout from GitHub
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-danger btn-lg mt-3"
                    onClick={login}
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
