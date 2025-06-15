import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const CLIENT_ID = "Ov23lixwco48McIOnHs2";
  const [rerender, setRerender] = useState(false);
  const [isSignup, setIsSignup] = useState(false); // for toggle
  const navigate = useNavigate();

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const codeParam = urlParams.get("code");

    if (codeParam && localStorage.getItem("access_token") === null) {
      async function getAccessToken() {
        try {
          const response = await fetch(
            `/github/getAccessToken?code=${codeParam}`
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
  }, []);

  async function getUserData() {
    try {
      const response = await fetch("/github/getUserData", {
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
        navigate("/dashboard");
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
      const res = await fetch("/users/signup", {
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
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch (err) {
      toast.error("Signup error");
    }
  };

  const loginUser = async () => {
    try {
      const res = await fetch("/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        // localStorage.setItem("access_token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("userId", data.userId);
        setUsername(data.username);
        toast.success("Login successful!");
        navigate("/dashboard");
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
    <div className="home-container">
      <div className="home-card">
        <div className="home-card-body">
          <h2 className="app-logo">CodeSyncX</h2>

          <div className={`form-slide ${isSignup ? "signup" : "login"}`}>
            {isSignup ? (
              <>
                <p className="form-title">Create an Account</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  placeholder="Email"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-control"
                  placeholder="Username"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  placeholder="Password"
                />
                <button onClick={signupUser} className="btn btn-warning">
                  Signup
                </button>
                <p>
                  Already have an account?{" "}
                  <button className="btn-link" onClick={() => setIsSignup(false)}>
                    Login
                  </button>
                </p>
              </>
            ) : (
              <>
                <p className="form-title">Welcome back!</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  placeholder="Email"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  placeholder="Password"
                />
                <button onClick={loginUser} className="btn btn-info">
                  Login
                </button>
                <p>
                  Don't have an account?{" "}
                  <button className="btn-link" onClick={() => setIsSignup(true)}>
                    Signup
                  </button>
                </p>
              </>
            )}
          </div>

          <hr />
          <h5>Or</h5>
          <button className="btn btn-danger btn-lg" onClick={loginWithGitHub}>
            Login with GitHub
          </button>

          {localStorage.getItem("access_token") && (
            <>
              <button onClick={logout} className="btn btn-outline-light btn-sm">
                Logout
              </button>
              <p className="logged-user">
                Logged in as: <strong>{localStorage.getItem("username")}</strong>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
