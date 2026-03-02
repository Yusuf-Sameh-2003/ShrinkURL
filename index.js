const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");
const urlshortenerSchema = require("./models/urlshortenerSchema.js");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const validUrl = require("valid-url");
const normalizeUrl = require("normalize-url");
const cors = require("cors");


dotenv.config();

const app = express();

app.use(express.json({ limit: "10kb" }));
app.disable("x-powered-by");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],

      scriptSrc: [
        "'self'",
        "'unsafe-inline'",               // لأن عندك inline JS
        "https://cdn.tailwindcss.com"
      ],

      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],

      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],

      imgSrc: [
        "'self'",
        "data:"
      ],

      connectSrc: [
        "'self'"
      ]
    }
  })
);
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}));
app.use(cors({
    origin: "https://shurlplus.vercel.app",
    methods: ["GET", "POST"],
}));

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB...");
});

mongoose.connection.on("error", (err) => {
    console.log("Error connecting to MongoDB !!!", err);
});

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/shorten", async (req, res) => {
    try {
        const { originalUrl } = req.body;
        const normalizedUrl = normalizeUrl(originalUrl, { forceHttps: true });
        if (!validUrl.isUri(normalizedUrl)) {
            return res.status(400).json({ error: "Invalid URL" });
        }
        const shortUrl = crypto.randomBytes(6).toString("hex");
        const urlshortener = new urlshortenerSchema({
            originalUrl,
            shortUrl
        });
        await urlshortener.save();
        res.json(urlshortener);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/:shortUrl", async (req, res) => {
    try {
        const { shortUrl } = req.params;

        if (!/^[a-f0-9]{12}$/.test(shortUrl)) {
            return res.status(400).json({ error: "Invalid short URL" });
        }

        const urlshortener = await urlshortenerSchema.findOne({ shortUrl });

        if (!urlshortener) {
            return res.status(404).json({ error: "URL not found" });
        }

        res.render("load", { url: urlshortener.originalUrl });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(3001, () => {
    console.log("Server started on port 3001");
});
