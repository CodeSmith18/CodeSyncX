import express from 'express'; // Import express
import compileAndRun from '../utils/compileAndRun.js';

const router = express.Router(); // Initialize the router




router.post('/:lang', async (req, res) => {
  const { lang } = req.params;
  const { code, input } = req.body;

  const filenameMap = {
    java: "Main.java",
    cpp: "Main.cpp",
    python: "Main.py",
  };

  if (!filenameMap[lang]) {
    return res.status(400).send({ error: "Unsupported language!" });
  }

  try {
    await compileAndRun(filenameMap[lang], lang, code, input, res);
  } catch (error) {
    console.error('Error during compilation:', error);
    res.status(500).send({ error: 'Internal server error!' });
  }
});

export default router; // Export the router
