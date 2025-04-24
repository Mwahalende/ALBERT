// server.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());

// MongoDB Connection
// Database Connection
mongoose
  .connect("mongodb+srv://user1:malafiki@leodb.5mf7q.mongodb.net/?retryWrites=true&w=majority&appName=leodb", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Connection error:", err));

const guestSchema = new mongoose.Schema({
  fullname: String,
  phone: String,
  email: String,
  password: String,
  roomId: Number,
  otp: String
});

const Guest = mongoose.model('Guest', guestSchema);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "leotitogalaxy@gmail.com",
      pass: "anxd ruea situ btug", // Replace with your email password
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
  

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post('/register', async (req, res) => {
  const { fullname, phone, email, password, confirmPassword, roomId } = req.body;
  if (password !== confirmPassword) return res.status(400).send("Passwords don't match");

  const otp = generateOTP();
  const guest = new Guest({ fullname, phone, email, password, roomId, otp });
  await guest.save();

  await transporter.sendMail({
    to: email,
    subject: "Welcome to Leo Mwahalende Guest House",
    text: `Welcome ${fullname}, your OTP is: ${otp}`
  });

  res.send("Guest registered and OTP sent!");
});

app.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  const guest = await Guest.findOne({ $or: [{ phone: identifier }, { email: identifier }] });

  if (!guest || guest.password !== password) return res.status(400).send("Invalid credentials");
  res.json({ roomId: guest.roomId, otp: guest.otp, id: guest._id });
});

app.get('/esp32/otp/:roomId', async (req, res) => {
  const guest = await Guest.findOne({ roomId: req.params.roomId });
  if (!guest) return res.status(404).send("Guest not found");
  res.json({ otp: guest.otp });
});

app.post('/esp32/send/:id', async (req, res) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) return res.status(404).send("Guest not found");
  // Simulated door close signal
  res.send("Door close signal sent");
});

// Admin Panel
app.get('/admin/guests', async (req, res) => {
  const guests = await Guest.find();
  res.json(guests);
});

app.delete('/admin/delete/:id', async (req, res) => {
  await Guest.findByIdAndDelete(req.params.id);
  res.send("Guest deleted");
});

app.put('/admin/update/:id', async (req, res) => {
  const { phone, email, roomId } = req.body;
  await Guest.findByIdAndUpdate(req.params.id, { phone, email, roomId });
  res.send("Guest updated");
});

app.post('/admin/resend/:id', async (req, res) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) return res.status(404).send("Guest not found");

  await transporter.sendMail({
    to: guest.email,
    subject: "Resent OTP - Leo Mwahalende Guest House",
    text: `Dear ${guest.fullname}, your OTP is: ${guest.otp}`
  });

  res.send("OTP resent successfully");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
