const { exec } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const compileAndRun = async (filename, language, code, input, res) => {
    const isWindows = process.platform === "win32";
    const inputFile = "input.txt";
  
    const commands = {
      java: `javac ${filename} && java ${path.basename(
        filename,
        ".java"
      )} < ${inputFile}`,
      cpp: isWindows
        ? `g++ ${filename} -o main.exe && main.exe < ${inputFile}`
        : `g++ ${filename} -o main && ./main < ${inputFile}`,
      python: `python ${filename} < ${inputFile}`,
    };
  
    try {
      // Validate input types
      if (typeof code !== "string" || typeof input !== "string") {
        throw new Error("Invalid code or input data type. Both must be strings.");
      }
  
      // Write the code and input to files
      await fs.writeFile(filename, code);
      await fs.writeFile(inputFile, input);
  
      // Execute the command for the specified language
      exec(commands[language], async (err, stdout, stderr) => {
        // Clean up the files after execution
        await fs.unlink(filename);
        await fs.unlink(inputFile);
  
        if (err) {
          console.error(`Compilation/Execution error: ${stderr}`);
          return res.send({ result: stderr });
          // res.send({ result: stderr });
        }
  
        res.send({ stdout });
        console.log(stdout);
      });
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return res.send({ result: error.message });
    }
  };

  module.exports = compileAndRun;