// Local read-only integration preview; never serves source files or .env files.
import express from "express";
import path from "node:path";
import api from "../api/index";

const preview = express();
const root = process.cwd();
preview.get(["/", "/index.html"], (_req, res) => res.sendFile(path.join(root, "index.html")));
preview.get("/docs", (_req, res) => res.sendFile(path.join(root, "docs.html")));
preview.use(api);
preview.listen(4173, "127.0.0.1", () => console.log("Read-only Ver preview: http://127.0.0.1:4173"));
