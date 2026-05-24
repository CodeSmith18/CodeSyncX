import { exec, execFile } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export const LANGUAGE_CONFIG = {
  java: {
    filename: "Main.java",
    cleanup: ["Main.java", "Main.class"],
  },
  cpp: {
    filename: "Main.cpp",
    cleanup: ["Main.cpp", "main", "main.exe"],
  },
  python: {
    filename: "Main.py",
    cleanup: ["Main.py"],
  },
};

const getCommand = (language) => {
  const isWindows = process.platform === "win32";
  const pythonCommand = isWindows ? "python" : "python3";

  const commands = {
    java: "javac Main.java && java Main < input.txt",
    cpp: isWindows
      ? "g++ Main.cpp -o main.exe && main.exe < input.txt"
      : "g++ Main.cpp -o main && ./main < input.txt",
    python: `${pythonCommand} Main.py < input.txt`,
  };

  return commands[language];
};

const getDockerCommand = (language) => {
  const commands = {
    java: "javac Main.java && java Main < input.txt",
    cpp: "g++ Main.cpp -o main && ./main < input.txt",
    python: "python3 Main.py < input.txt",
  };

  return commands[language];
};

const normalizeOutput = (value = "") => {
  const maxBytes = Number(process.env.EXECUTION_OUTPUT_LIMIT_BYTES || 20000);
  return value.length > maxBytes
    ? `${value.slice(0, maxBytes)}\n[output truncated]`
    : value;
};

const createJobDirectory = async () => {
  return fs.mkdtemp(path.join(os.tmpdir(), "codesyncx-exec-"));
};

const cleanupDirectory = async (dir) => {
  await fs.rm(dir, { recursive: true, force: true });
};

export const executeCodeLocally = async ({ language, code, input = "" }) => {
  const config = LANGUAGE_CONFIG[language];

  if (!config) {
    throw new Error("Unsupported language!");
  }

  if (typeof code !== "string" || typeof input !== "string") {
    throw new Error("Invalid code or input data type. Both must be strings.");
  }

  const dir = await createJobDirectory();
  const startedAt = Date.now();

  try {
    await fs.writeFile(path.join(dir, config.filename), code);
    await fs.writeFile(path.join(dir, "input.txt"), input);

    const { stdout, stderr } = await execAsync(getCommand(language), {
      cwd: dir,
      timeout: Number(process.env.EXECUTION_TIMEOUT_MS || 5000),
      maxBuffer: Number(process.env.EXECUTION_OUTPUT_LIMIT_BYTES || 20000),
    });

    return {
      success: true,
      stdout: normalizeOutput(stdout),
      stderr: normalizeOutput(stderr),
      executionTimeMs: Date.now() - startedAt,
      runtime: "local",
    };
  } catch (error) {
    return {
      success: false,
      stdout: normalizeOutput(error.stdout),
      stderr: normalizeOutput(error.stderr || error.message),
      executionTimeMs: Date.now() - startedAt,
      runtime: "local",
    };
  } finally {
    await cleanupDirectory(dir);
  }
};

export const executeCodeInDocker = async ({ language, code, input = "" }) => {
  const config = LANGUAGE_CONFIG[language];

  if (!config) {
    throw new Error("Unsupported language!");
  }

  if (typeof code !== "string" || typeof input !== "string") {
    throw new Error("Invalid code or input data type. Both must be strings.");
  }

  const dir = await createJobDirectory();
  const startedAt = Date.now();

  try {
    await fs.writeFile(path.join(dir, config.filename), code);
    await fs.writeFile(path.join(dir, "input.txt"), input);

    const image = process.env.EXECUTION_DOCKER_IMAGE || "codesyncx-runner";
    const command = getDockerCommand(language);

    const { stdout, stderr } = await execFileAsync(
      "docker",
      [
        "run",
        "--rm",
        "--network",
        "none",
        "--memory",
        process.env.EXECUTION_DOCKER_MEMORY || "128m",
        "--cpus",
        process.env.EXECUTION_DOCKER_CPUS || "0.5",
        "--pids-limit",
        process.env.EXECUTION_DOCKER_PIDS || "64",
        "-v",
        `${dir}:/workspace`,
        "-w",
        "/workspace",
        image,
        "timeout",
        `${Math.ceil(Number(process.env.EXECUTION_TIMEOUT_MS || 5000) / 1000)}s`,
        "bash",
        "-lc",
        command,
      ],
      {
        timeout: Number(process.env.EXECUTION_TIMEOUT_MS || 5000) + 1000,
        maxBuffer: Number(process.env.EXECUTION_OUTPUT_LIMIT_BYTES || 20000),
      }
    );

    return {
      success: true,
      stdout: normalizeOutput(stdout),
      stderr: normalizeOutput(stderr),
      executionTimeMs: Date.now() - startedAt,
      runtime: "docker",
    };
  } catch (error) {
    return {
      success: false,
      stdout: normalizeOutput(error.stdout),
      stderr: normalizeOutput(error.stderr || error.message),
      executionTimeMs: Date.now() - startedAt,
      runtime: "docker",
    };
  } finally {
    await cleanupDirectory(dir);
  }
};

export const executeCode = async (payload) => {
  if (process.env.EXECUTION_MODE === "docker") {
    return executeCodeInDocker(payload);
  }

  return executeCodeLocally(payload);
};
