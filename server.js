import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import routes from './src/routes/index.js'
dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use("/", routes);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/src/views"));
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
