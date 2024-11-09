import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import multer from 'multer';
import { create } from 'ipfs-core';
import URL from './models/url.js';

dotenv.config();

const app = express();
app.use(express.json());

// MongoDB URI (replace with your own connection string)
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// Setup multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(cors({
  origin: ["http://localhost:5173", "https://bit-bn-b-hive.vercel.app"] // add your deployed frontend URL
}));

// Initialize IPFS (with retry)
let ipfs;
async function initializeIpfs(retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      ipfs = await create();
      console.log("IPFS node is ready");
      return;
    } catch (error) {
      console.error("Failed to initialize IPFS:", error);
      if (i < retries - 1) {
        console.log(`Retrying IPFS initialization in ${delay / 1000} seconds...`);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
  process.exit(1);
}
initializeIpfs();

// Function to detect file type based on the file's extension
function getFileType(filename) {
  const extension = filename.split('.').pop();
  const allowedTypes = ['html', 'js', 'jsx', 'ts', 'tsx', 'xlsx', 'py', 'ipynb', 'pdf', 'docx', 'txt', 'png', 'jpg'];
  return allowedTypes.includes(extension) ? extension : 'unknown';
}

// Endpoint to save IPFS link and metadata for non-HTML files
app.post('/upload/save-url', async (req, res) => {
  try {
    const { link, projectName, fileType, username } = req.body;
    const shortId = nanoid(6);

    const newUrl = new URL({
      redirectUrl: link,
      shortId,
      projectName,
      fileType,
      username,
    });

    await newUrl.save();
    res.status(200).json({ message: "Data saved successfully" });
  } catch (error) {
    console.error("Failed to save URL:", error);
    res.status(500).json({ message: "Failed to save URL" });
  }
});

// Function to handle file upload and URL generation
async function handleFileUpload(req, res) {
  try {
    const { file, body: { projectName, username } } = req; // Get username from request body

    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // Get the file type
    const fileType = getFileType(file.originalname);
    if (fileType === 'unknown') {
      return res.status(400).json({ message: "Unsupported file type." });
    }

    // Add file to IPFS
    const { cid } = await ipfs.add(file.buffer);
    const link = `https://ipfs.io/ipfs/${cid.toString()}`;

    // Generate a shortened link and save to MongoDB
    const shortId = nanoid(6);
    const newUrl = new URL({
      redirectUrl: link,
      shortId,
      projectName,
      fileType,
      username // Save the username to the database
    });

    await newUrl.save();
    res.json({ shortLink: `https://bitbnb.io/${shortId}`, ipfsLink: link });
  } catch (error) {
    console.error("File upload failed:", error);
    res.status(500).json({ message: "File upload failed" });
  }
}

app.post('/upload', upload.single('file'), handleFileUpload);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
