const express = require('express');
const fetch = (...args)=>
  import('node-fetch').then(({default:fetch})=>fetch(...args));
const router = express.Router();

router.get('/getAccessToken', async function (req, res) {
  console.log(req.query.code);

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code: req.query.code,
    scope: 'user repo',  
  });

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: params,  // Send the parameters in the request body
    });

    const data = await response.json();
    console.log(data, 'Access token');
    res.json(data);  // Send the access token back to the client
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching access token');
  }
});

// Handle GitHub User Data request
router.get('/getUserData', async function (req, res) {
  const accessToken = req.get('Authorization');  // Get the Bearer token from the Authorization header

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is missing in Authorization header' });
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        'Authorization': accessToken,  // Send the access token as Authorization Bearer
      },
    });

    const data = await response.json();

    if (data.message === 'Bad credentials') {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    console.log(data);
    res.json(data);  // Send user data back to the client
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching user data');
  }
});

module.exports = router;
