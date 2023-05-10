import express from "express";
import path from "path";

const __dirname = path.resolve();
const app = express();

app.use(express.static("meme/www"));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile("meme/www/index.html", { root: __dirname });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
