const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");
const path = require("path");
const urlshortenerSchema = require("./models/urlshortenerSchema.js");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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
    const { originalUrl } = req.body;
    const shortUrl = shortid.generate();
    const urlshortener = new urlshortenerSchema({
        originalUrl,
        shortUrl
    });
    await urlshortener.save();
    res.json(urlshortener);
});

app.get("/:shortUrl", async (req, res) => {
    const { shortUrl } = req.params;
    const urlshortener = await urlshortenerSchema.findOne({ shortUrl });
    if (urlshortener) {
        //res.redirect(urlshortener.originalUrl);
        res.render("load", { url: urlshortener.originalUrl });
    } else {
        res.status(404).json({ error: "URL not found" });
    }
});

app.listen(3001, () => {
    console.log("Server started on port 3001");
});
