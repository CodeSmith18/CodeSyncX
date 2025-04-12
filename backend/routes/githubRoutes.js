const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const router = express.Router();
const axios = require('axios');
const GITHUB_API_URL = 'https://api.github.com';


// Helper function to make GitHub API requests
async function githubRequest(url, method, token, body = null) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'GitHub API error');
    return data;
}

// Get GitHub Access Token
router.get('/getAccessToken', async (req, res) => {
    if (!req.query.code) {
        return res.status(400).json({ error: 'Authorization code is missing' });
    }
    
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: req.query.code,
        scope: 'user repo',
    });

    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: params,
        });
        const data = await response.json();
        console.log('Access Token:', data.access_token);
        if (!data.access_token) throw new Error('Invalid authorization code');
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching access token' });
    }
});

// Get GitHub User Data
router.get('/getUserData', async (req, res) => {
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({ error: 'Access token missing or invalid' });
    }
    const accessToken = authHeader.split(' ')[1];
    
    try {
        const data = await githubRequest(`${GITHUB_API_URL}/user`, 'GET', accessToken);
        res.json(data);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// Create Repository
async function createRepository(accessToken, repo) {
  try {
      const response = await githubRequest(`${GITHUB_API_URL}/user/repos`, 'POST', accessToken, {
          name: repo,
          private: false, // Set to true for private repo
          description: 'Auto-created repository',
          auto_init: true // Ensures repo initializes properly
      });
      console.log(`Repository ${repo} created successfully.`);
      return true;
  } catch (error) {
      console.error('Error creating repository:', error.message);
      return false;
  }
}


// Upload File to GitHub
router.post('/uploadFile', async (req, res) => {
  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ error: 'Authorization token missing or invalid' });
  }
  const accessToken = authHeader.split(' ')[1];
  const { owner, repo, content, commitMessage, branch = 'main' } = req.body;

  if (!owner || !repo || !content || !commitMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
      // Generate unique filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filePath = `file_${dateStr}.txt`;
      const repoUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}`;

      // Check if repository exists
      try {
          await githubRequest(repoUrl, 'GET', accessToken);
      } catch (error) {
          console.log(`Repository ${repo} not found. Creating...`);
          const created = await createRepository(accessToken, repo);
          if (!created) return res.status(500).json({ error: 'Failed to create repository' });
      }

      // Encode content in base64
      const encodedContent = Buffer.from(content, 'utf-8').toString('base64');
      const fileUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${filePath}`;

      // Upload file (without checking existence)
      const payload = {
          message: commitMessage,
          content: encodedContent,
          branch: branch,
      };

      const responseData = await githubRequest(fileUrl, 'PUT', accessToken, payload);
      res.json({ message: 'File uploaded successfully!', filename: filePath, data: responseData });
  } catch (error) {
      console.error('Error:', error.message);
      res.status(500).json({ error: error.message });
  }
});


module.exports = router;
