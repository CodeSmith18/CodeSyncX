import express from 'express'; // Import express
import { addExecutionJob, getExecutionJobStatus } from '../queues/executionQueue.js';
import { LANGUAGE_CONFIG } from '../services/executionService.js';
import { compileLimiter } from '../middleware/rateLimiters.js';

const router = express.Router(); // Initialize the router




router.post('/:lang', compileLimiter, async (req, res) => {
  const { lang } = req.params;
  const { code, input } = req.body;

  if (!LANGUAGE_CONFIG[lang]) {
    return res.status(400).send({ error: "Unsupported language!" });
  }

  try {
    const jobId = await addExecutionJob({ language: lang, code, input });
    res.status(202).send({ success: true, jobId, status: "queued" });
  } catch (error) {
    console.error('Error queueing compilation:', error);
    res.status(503).send({
      success: false,
      error: 'Execution queue unavailable. Make sure Redis and the worker are running.',
    });
  }
});

router.get('/jobs/:jobId', async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await getExecutionJobStatus(jobId);

    if (!job) {
      return res.status(404).send({ success: false, error: "Job not found" });
    }

    res.send({ success: true, job });
  } catch (error) {
    console.error('Error fetching compilation job:', error);
    res.status(503).send({
      success: false,
      error: 'Execution queue unavailable. Make sure Redis is running.',
    });
  }
});

export default router; // Export the router
