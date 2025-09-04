# 🚀 Collaborative Code Editor

A real-time collaborative code editor built with the **MERN stack**, **Socket.io**, and **Docker** for multi-language code execution.  
This project provides a **VS Code-like environment** in the browser using the **Monaco Editor**, enabling developers to collaborate, write, and execute code seamlessly.

---

## ✨ Features

- 🔗 **Real-Time Collaboration** – Multiple users can edit code simultaneously with seamless synchronization via **Socket.io**.  
- 🐳 **Multi-Language Execution** – Docker-based execution supporting C++, JavaScript, Python, and Java with response times under **2 seconds**.  
- 🖊️ **VS Code-like Editing** – Integrated **Monaco Editor** for an intuitive developer experience.  
- 📤 **Shareable Links** – Generate collaboration links to invite others, boosting engagement by **40%**.  
- 🐙 **GitHub Integration** – Commit files directly to user repositories using the **GitHub Octokit API**.  
- 💾 **Persistent Sessions** – Manage users, projects, and sessions with **MongoDB** and **Express.js**.  

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Monaco Editor  
- **Backend:** Node.js, Express.js, Socket.io  
- **Database:** MongoDB  
- **Containerization:** Docker  
- **Version Control API:** GitHub Octokit  
- **Deployment:** (Add your platform e.g., Vercel, AWS, or Heroku)  

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16+)
- Docker
- MongoDB (local or Atlas)
- GitHub OAuth token (for repository commits)

### Steps
```bash
# Clone the repository
git clone https://github.com/your-username/collaborative-code-editor.git
cd collaborative-code-editor

# Install dependencies
npm install
cd client && npm install

# Add environment variables in .env
MONGO_URI=your_mongo_uri
GITHUB_TOKEN=your_github_token
PORT=5000

# Start Docker containers
docker-compose up --build

# Run the backend
npm run dev

# Run the frontend
cd client
npm start
