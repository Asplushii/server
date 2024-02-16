const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
http.createServer((_, res) => res.end("Alive")).listen(8080);
const app = express();

app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const EntrySchema = new mongoose.Schema({
  title: String,
  text: String,
  userId: String,
  color: String,
  entryDate: String,
  entryTime: String,
  originalEntryDate: Date,
});
EntrySchema.index({ userId: 1, entryDate: 1, entryTime: 1, color: 1 });

const Entry = mongoose.model("Entry", EntrySchema);

app.post("/api/entries", async (req, res) => {
  try {
    const { title, text, userId } = req.body;
    const color = generateRandomPastelColor();
    const currentDate = new Date();
    const entry = new Entry({
      title,
      text,
      userId,
      color,
      entryDate: formatDate(currentDate),
      entryTime: formatTime(currentDate),
      originalEntryDate: currentDate,
    });
    await entry.save();
    res.status(200).json({ message: "Entry saved successfully", entry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save entry" });
  }
});

app.get("/api/entries/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const entries = await Entry.find(
      { userId },
      "title text color entryDate entryTime",
    ).lean();
    res.status(200).json({ entries });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch entries", error: error.message });
  }
});

app.get("/api/entry/:entryId", async (req, res) => {
  try {
    const entryId = req.params.entryId;
    const entry = await Entry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.status(200).json(entry);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch entry", error: error.message });
  }
});

app.put("/api/entry/:entryId", async (req, res) => {
  try {
    const entryId = req.params.entryId;
    const updatedEntry = req.body;
    const result = await Entry.findByIdAndUpdate(entryId, updatedEntry, {
      new: true,
    });
    res.status(200).json({ message: "Entry updated successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to update entry", error: error.message });
  }
});

app.delete("/api/entries", async (req, res) => {
  try {
    const { entryIds } = req.body;
    const result = await Entry.deleteMany({ _id: { $in: entryIds } });
    if (result.deletedCount > 0) {
      res.status(200).json({ message: "Entries deleted successfully" });
    } else {
      res.status(404).json({ message: "No entries found to delete" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to delete entries", error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

function generateRandomPastelColor() {
  const hue = Math.floor(Math.random() * 360);
  const lightness = 80 + Math.floor(Math.random() * 10);
  return `hsl(${hue}, 50%, ${lightness}%)`;
}

function formatTime(timestamp) {
  const entryTime = new Date(timestamp);
  const timeString = entryTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return timeString.replace(/\s/g, "").toLowerCase();
}

function formatDate(timestamp) {
  const entryTime = new Date(timestamp);
  const day = entryTime.getDate();
  const month = getMonthName(entryTime.getMonth());
  const year = entryTime.getFullYear();
  const dayWithSuffix = `${day}${getOrdinalSuffix(day)}`;
  const formattedTime = entryTime.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const timeWithoutSpace = formattedTime.replace(/\s/g, "").toLowerCase();
  return `${dayWithSuffix} ${month} ${year}, ${timeWithoutSpace}`;
}

function getMonthName(month) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames[month];
}

function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) {
    return "th";
  }
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
