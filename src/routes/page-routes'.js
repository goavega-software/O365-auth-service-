import express from "express";
import { serverConfig } from '../config/server-config.js'
const router = express.Router();
const { nodeAppBaseUrl } = serverConfig;

router.get("/", (req, res) => {
    res.render("login", { nodeAppBaseUrl });
});


export default router;
