import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import aws from "aws-sdk";
import multerS3 from "multer-s3";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected')).catch(err => console.error(err));

// Models
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  profileImage: String,
});

const NoteSchema = new mongoose.Schema({
    title: String,
    content: String,
    image_url: String,
    audio_url: String,  // Added audio storage
    user_id: mongoose.Schema.Types.ObjectId,
    is_favorite: Boolean,
    created_at: { type: Date, default: Date.now },
  });

const User = mongoose.model('User', UserSchema);
const Note = mongoose.model('Note', NoteSchema);

const s3Client = new S3Client({
  region: process.env.AWS_REGION, // Example: "us-east-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadFile = async (fileBuffer, fileName, mimeType) => {
  try {
    const upload = new Upload({
      client: s3Client, // ✅ Use S3Client instead of AWS.S3()
      params: {
        Bucket: process.env.AWS_BUCKET_NAME, // S3 Bucket Name
        Key: `profile-pictures/${fileName}`, // File Path in S3
        Body: fileBuffer, // File Data
        ContentType: mimeType,
      },
    });

    const result = await upload.done(); // ✅ Upload file
    return result.Location; // Return uploaded file URL
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
};

const uploadAudioFile = async (fileBuffer, fileName, mimeType) => {
  try {
    const upload = new Upload({
      client: s3Client, // ✅ Use S3Client instead of AWS.S3()
      params: {
        Bucket: process.env.AWS_BUCKET_NAME, // S3 Bucket Name
        Key: `audios/${fileName}`, // File Path in S3
        Body: fileBuffer, // File Data
        ContentType: mimeType,
      },
    });

    const result = await upload.done(); // ✅ Upload file
    return result.Location; // Return uploaded file URL
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
};

// Function to delete old file from S3
const deleteFileFromS3 = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    const bucketName = process.env.AWS_BUCKET_NAME;
    const filePath = fileUrl.split(".com/")[1]; // Extract file path from URL

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });

    await s3Client.send(command);
    console.log("Deleted from S3:", filePath);
  } catch (error) {
    console.error("Error deleting from S3:", error);
  }
};

const storage = multer.memoryStorage(); // Store file in memory before upload
const upload = multer({ storage });

// Authentication Routes
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(email, password);
    const user = new User({email: email, password: hashedPassword });
    console.log("1111111");
    await user.save();
    console.log("2222222");
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    console.log(user);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user._id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notes Routes
app.get('/notes', async (req, res) => {
  try {
    const { user_id, sort, is_favorite } = req.query;
    let filter = { user_id };
    // console.log("10101101010");
    if (is_favorite) filter.is_favorite = true;
    const notes = await Note.find(filter).sort({ created_at: sort === 'asc' ? 1 : -1 });
    // console.log(notes);
    // console.log("222222222220101101010");
    res.json(notes);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/upload-note', upload.fields([{name:"image"},{name:"audio"}]), async (req, res) => {
  console.log(req.body);
    const { title, content, user_id, is_favorite } = req.body;
    console.log(title);
    if(!title || !content || !user_id){
      return res.status(400).json({error: 'Title, content, and user_id are required'});
    }
    console.log(content);
    let image_url = null;
    let audio_url = null;

    if (req.files.image) {
      const imageFile = req.files.image[0];
      const imageFileName = `${Date.now()}-image.${imageFile.mimetype.split("/")[1]}`;
      image_url = await uploadFile(imageFile.buffer, imageFileName, imageFile.mimetype, "images");
    }

    if (req.files.audio) {
      const audioFile = req.files.audio[0];
      const audioFileName = `${Date.now()}-audio.wav`;
      audio_url = await uploadFile(audioFile.buffer, audioFileName, audioFile.mimetype, "audio");
    }
    try {
      const newNote = new Note({
        title,
        content,
        image_url,
        audio_url,  // Save audio URL in DB
        user_id,
        is_favorite,
      });
      await newNote.save();

      console.log(newNote);
      res.status(201).json(newNote);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// ✅ Updated PUT API
app.put("/upload-note/:id", upload.fields([{ name: "image" }, { name: "audio" }]), async (req, res) => {
  try {
    const { title, content, user_id, is_favorite } = req.body;
    if (!title || !content || !user_id) {
      return res.status(400).json({ error: "Title, content, and user_id are required" });
    }

    // Find the existing note
    const existingNote = await Note.findById(req.params.id);
    if (!existingNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    let image_url = existingNote.image_url;
    let audio_url = existingNote.audio_url;

    // Upload new image if provided
    if (req.files.image) {
      const imageFile = req.files.image[0];
      const imageFileName = `${Date.now()}-image.${imageFile.mimetype.split("/")[1]}`;
      const newImageUrl = await uploadFile(imageFile.buffer, imageFileName, imageFile.mimetype, "images");

      // Delete old image from S3 (if it exists)
      if (existingNote.image_url) await deleteFileFromS3(existingNote.image_url);

      image_url = newImageUrl;
    }

    // Upload new audio if provided
    if (req.files.audio) {
      const audioFile = req.files.audio[0];
      const audioFileName = `${Date.now()}-audio.wav`;
      const newAudioUrl = await uploadFile(audioFile.buffer, audioFileName, audioFile.mimetype, "audio");

      // Delete old audio from S3 (if it exists)
      if (existingNote.audio_url) await deleteFileFromS3(existingNote.audio_url);

      audio_url = newAudioUrl;
    }

    // Update note
    existingNote.title = title;
    existingNote.content = content;
    existingNote.image_url = image_url;
    existingNote.audio_url = audio_url;
    existingNote.user_id = user_id;
    existingNote.is_favorite = is_favorite;

    const updatedNote = await existingNote.save();
    res.json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // 🟢 Delete associated image file from S3 (if exists)
    if (note.image_url) await deleteFileFromS3(note.image_url);

    // 🟢 Delete associated audio file from S3 (if exists)
    if (note.audio_url) await deleteFileFromS3(note.audio_url);

    console.log(req.params.id);
    await Note.findByIdAndDelete(req.params.id);
  
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/notes/:user_id/:note_id', async (req, res) => {
  try {
    const { is_favorite } = req.body;
    console.log("11111");

    const note = await Note.findOne({ _id: req.params.note_id, user_id: req.params.user_id });

    console.log(note);
    const newnote = await Note.findByIdAndUpdate(req.params.note_id, { is_favorite:!note.is_favorite }, { new: true });
    console.log(newnote);
    console.log("2222");
    console.log(note);
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 **Upload Profile Picture API**
app.post("/upload/:userId", upload.single("profileImage"), async (req, res) => {
  try {
    console.log("Hai 1111111111111111111111");
    const userId = req.params.userId;
    const fileBuffer = req.file.buffer; // Get file data
    const fileName = `${userId}_${req.file.originalname}`;
    const mimeType = req.file.mimetype;

    // Upload file to S3
    const imageUrl = await uploadFile(fileBuffer, fileName, mimeType);

    console.log(imageUrl);

    // 🔹 Update user in MongoDB with image URL
    await User.findByIdAndUpdate(userId, { profileImage: imageUrl });

    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/notes/upload-image/:noteId", upload.single("noteImage"), async (req, res) => {
  try {
    const userId = req.params.userId;
    const noteId = req.params.noteId;
    const fileBuffer = req.file.buffer; // Get file data
    const fileName = `${noteId}_${Date.now()}_${req.file.originalname}`;
    const mimeType = req.file.mimetype;

    // Upload file to S3
    const imageUrl = await uploadFile(fileBuffer, fileName, mimeType);

    // 🔹 Update user in MongoDB with image URL
    await Note.findByIdAndUpdate(noteId, { image_url: imageUrl });

    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/notes/upload-audio/:noteId", upload.single("noteAudio"), async (req, res) => {
  try {
    const userId = req.params.userId;
    const noteId = req.params.noteId;
    const fileBuffer = req.file.buffer; // Get file data
    const fileName = `${noteId}_${Date.now()}_${req.file.originalname}`;
    const mimeType = req.file.mimetype;

    // Upload file to S3
    const audioUrl = await uploadAudioFile(fileBuffer, fileName, mimeType);

    // 🔹 Update user in MongoDB with image URL
    await Note.findByIdAndUpdate(noteId, { audio_url: audioUrl });

    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ✅ API to Get User Profile Image by userId
app.get("/profile-image/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    

    if (!user || !user.profileImage) {
      return res.status(404).json({ error: "Profile image not found" });
    }

    res.json({ imageUrl: user.profileImage }); // ✅ Return S3 image URL
  } catch (error) {
    console.error("Error fetching profile image:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
