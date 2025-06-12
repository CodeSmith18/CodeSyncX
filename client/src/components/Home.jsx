import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Home() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const CLIENT_ID = "Ov23lixwco48McIOnHs2";
  const [rerender, setRerender] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const codeParam = urlParams.get("code");

    if (codeParam && localStorage.getItem("access_token") === null) {
      async function getAccessToken() {
        try {
          const response = await fetch(
            `http://localhost:5000/github/getAccessToken?code=${codeParam}`
          );
          const data = await response.json();
          if (data.access_token) {
            localStorage.setItem("access_token", data.access_token);
            setRerender(!rerender);
            await getUserData();
          }
        } catch (error) {
          console.error("Error fetching access token:", error);
        }
      }
      getAccessToken();
    }
  }, [rerender]);

  async function getUserData() {
    try {
      const response = await fetch("http://localhost:5000/github/getUserData", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("username", data.username);
        localStorage.setItem("userId", data.userId);
        setUsername(data.username);
        toast.success("GitHub login successful");
        navigate("/dashboard"); // 👈 redirect
      } else {
        toast.error(data.error || "Failed to fetch GitHub user data");
      }

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Error fetching GitHub user data");
    }
  }

  const signupUser = async () => {
    try {
      const res = await fetch("http://localhost:5000/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("access_token", data.token);
        localStorage.setItem("username", data.username);
        setUsername(data.username);
        toast.success("Signup successful!");
        navigate("/dashboard"); // 👈 redirect
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch (err) {
      toast.error("Signup error");
    }
  };

  const loginUser = async () => {
    try {
      const res = await fetch("http://localhost:5000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("access_token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("userId", data.userId);
        setUsername(data.username);
        toast.success("Login successful!");
        navigate("/dashboard"); // 👈 redirect
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      toast.error("Login error");
    }
  };

  const loginWithGitHub = () => {
    window.location.assign(
      `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`
    );
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    setUsername("");
    toast.success("Logged out");
    setRerender(!rerender);
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-12 col-md-6">
          <div className="card shadow-sm p-3 bg-secondary rounded">
            <div className="card-body text-center bg-dark">
              <img
                src="/images/codecast.png"
                alt="Logo"
                className="img-fluid mx-auto d-block mb-2"
                style={{ maxWidth: "150px" }}
              />

              <h5 className="text-light">Login with Email</h5>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control mb-2"
                placeholder="Email"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-control mb-2"
                placeholder="Username"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control mb-2"
                placeholder="Password"
              />
              <div className="d-flex justify-content-between">
                <button onClick={signupUser} className="btn btn-warning">
                  Signup
                </button>
                <button onClick={loginUser} className="btn btn-info">
                  Login
                </button>
              </div>

              <hr className="bg-light" />

              <h5 className="text-light mt-3">Or</h5>
              <button
                className="btn btn-danger btn-lg mt-2"
                onClick={loginWithGitHub}
              >
                Login with GitHub
              </button>

              {localStorage.getItem("access_token") && (
                <>
                  <button
                    onClick={logout}
                    className="btn btn-outline-light btn-sm mt-3"
                  >
                    Logout
                  </button>
                  <p className="text-light mt-2">
                    Logged in as:{" "}
                    <strong>{localStorage.getItem("username")}</strong>
                  </p>
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
