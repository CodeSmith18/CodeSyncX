import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

const compileAndRun = async (filename, language, code, input, res) => {
  const jobId = uuid();
  const folderPath = path.join(process.cwd(), "tmp", jobId);

  const languageMap = {
    cpp: {
      file: "main.cpp",
      image: "cpp-runner", // Docker image you build from Dockerfile-cpp
      dockerfile: "Dockerfile-cpp"
    },
    java: {
      file: "Main.java",
      image: "java-runner",
      dockerfile: "Dockerfile-java"
    },
    python: {
      file: "main.py",
      image: "python-runner",
      dockerfile: "Dockerfile-python"
    }
  };

  const config = languageMap[language];
  if (!config) {
    console.error("❌ Unsupported language:", language);
    return res.send({ result: "Unsupported language." });
  }

  try {
    console.log("⚙️ compileAndRun called with:", {
      filename,
      language,
      input,
      code: code.slice(0, 100) + "..." // Just preview first 100 chars
    });

    console.log("📁 Creating job folder at:", folderPath);
    await fs.mkdir(folderPath, { recursive: true });

    // Write code and input to files
    await fs.writeFile(path.join(folderPath, config.file), code);
    await fs.writeFile(path.join(folderPath, "input.txt"), input);

    const files = await fs.readdir(folderPath);
    console.log("📦 Files created in folder:", files);

    const dockerRunCmd = `docker run --rm -m 100m --cpus="0.5" --network=none -v "${folderPath}:/app" ${config.image}`;

    console.log("🐳 Running Docker:", dockerRunCmd);

    exec(dockerRunCmd, { timeout: 10000 }, async (err, stdout, stderr) => {
      console.log("📤 STDOUT:", stdout);
      console.log("📥 STDERR:", stderr);
      console.log("❗ ERROR:", err);

      // Commenting out deletion to debug manually
      await fs.rm(folderPath, { recursive: true, force: true });

      if (err) {
        return res.send({ result: stderr || err.message });
      }

      res.send({ result: stdout || stderr || "Empty output" });
    });

  } catch (err) {
    console.error("🔥 Internal error:", err.message);
    return res.send({ result: "Internal error: " + err.message });
  }
};

export default compileAndRun;
