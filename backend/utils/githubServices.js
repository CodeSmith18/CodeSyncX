const axios = require("axios");




const createRepo = async (accessToken, repoName) => {
  try {
    const response = await axios.post(
      "https://api.github.com/user/repos",
      {
        name: repoName,
        private: false, // You can make the repository private if needed
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    return response.data; // Return repo details
  } catch (error) {
    throw new Error("Error creating repository: " + error.message);
  }
};

const uploadFileToRepo = async (accessToken, owner, repoName, filePath, fileContent) => {
  try {
    const response = await axios.put(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
      {
        message: "Upload new file",
        content: Buffer.from(fileContent).toString("base64"),
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    return response.data; // Return file upload details
  } catch (error) {
    throw new Error("Error uploading file: " + error.message);
  }
};

module.exports = { createRepo, uploadFileToRepo ,getToken };
