import express from 'express';
import fetch from 'node-fetch';
import axios from 'axios';
import { Octokit } from '@octokit/rest';
import { createOAuthAppAuth } from '@octokit/auth-oauth-app';

import User from '../Models/userModel.js';
import jwt from "jsonwebtoken";

const router = express.Router();
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
    const githubUser = await githubRequest(`${GITHUB_API_URL}/user`, 'GET', accessToken);

    const email = githubUser.email || `${githubUser.id}@github.fake.com`;
    const username = githubUser.login;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        username,
        email,
        password: "",
        authType: "github",
      });

      await user.save();
      console.log(`✅ New user created from GitHub: ${username}`);
    } else {
      console.log(`🔁 Returning user logged in via GitHub: ${username}`);
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "GitHub login successful",
      token,
      username: user.username,
      userId: user._id,   // 👈 Added this
      email: user.email
    });

  } catch (error) {
    console.error("GitHub login failed:", error.message);
    res.status(401).json({ error: error.message });
  }
});

router.post('/uploadFile', async (req, res) => {
  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ error: 'Authorization token missing or invalid' });
  }

  const accessToken = authHeader.split(' ')[1];
  const {title, owner, repo, content, commitMessage, branch = 'main' } = req.body;

  const octokit = new Octokit({ auth: accessToken });

  try {
    const user = await octokit.rest.users.getAuthenticated();
    const username = user.data.login;

    // Check if the repository already exists
    try {
      await octokit.rest.repos.get({ owner: username, repo });
      console.log(`Repository "${repo}" already exists.`);
    } catch (err) {
      if (err.status === 404) {
        // Repo doesn't exist, create it
        console.log(`Creating repository "${repo}"...`);
        await octokit.rest.repos.createForAuthenticatedUser({
          name: repo,
          private: false,
        });
      } else {

        throw err;
      }
    }

    // Generate unique filename
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `${title}-${timestamp}.cpp`;

    const contentEncoded = Buffer.from(content).toString('base64');

    // Upload file with unique name
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: username,
      repo,
      path: filename,
      message: commitMessage || `Add file ${filename}`,
      content: contentEncoded,
      branch,
    });

    res.json({ message: 'File uploaded successfully!', file: filename });

  } catch (err) {
    console.error('GitHub API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


router.get('/listRepoFiles', async (req, res) => {

  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ error: 'Authorization token missing or invalid' });
  }

  const accessToken = authHeader.split(' ')[1];
  const repo = "CodeSync";
  const branch = "main";
  const { owner } = req.query;

  const octokit = new Octokit({ auth: accessToken });

  try {
    const refData = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    const commitsha = refData.data.object.sha;

    const commitData = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: commitsha,
    });

    const treeSha = commitData.data.tree.sha;

    const treeData = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: treeSha,
      recursive: "1",
    });

    const files = treeData.data.tree.filter(item => item.type === 'blob');

    res.json({
      repo,
      branch,
      totalFiles: files.length,
      files: files.map(file => ({
        path: file.path,
        size: file.size,
        sha: file.sha,
        url: `https://github.com/${owner}/${repo}/blob/${branch}/${file.path}`,
      })),


    });
  }
  catch (err) {
    console.error('Error listing repo files:', err.message);
    res.status(500).json({ error: err.message });
  }
});




export default router;
