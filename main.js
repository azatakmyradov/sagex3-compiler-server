import express from "express";
const app = express();
import multer from "multer";
import bodyParser from "body-parser";
import { pino as createLogger } from "pino";
const logger = createLogger();
import fs from "fs";
import normalizeNewline from "normalize-newline";
import dotenv from "dotenv";
dotenv.config();

import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Default paths
const upload = multer({ dest: "tmp/" });
const X3_PATH = process.env.X3_PATH;
const ROOT_PATH = __dirname;
const X3_URL = process.env.X3_URL;

const port = process.env.PORT;

import Adonix from "./src/Adonix.js";
const adx = new Adonix(X3_PATH, ROOT_PATH);

app.use(bodyParser.json());

if (process.env.ENV === "DEV") {
  app.use((req, res, next) => {
    logger.info(req);
    next();
  });
}

function isAuthenticated(req, res) {
  if (
    req.query.username !== process.env.CUSERNAME ||
    req.query.password !== process.env.CPASSWORD
  ) {
    return false;
  }

  return true;
}

/*
 * Returns JSON to check if the server is up
 */
app.get("/", (req, res) => {
  res.json({
    message: "working",
  });
});

/*
 * Returns file names in TRT folder
 */
app.get("/:folder/files", (req, res) => {
  const X3Folder = req.params.folder.toUpperCase();

  if (!isAuthenticated(req, res)) {
    return res.json({
      message: "unauthenticated",
    });
  }

  adx.files(X3Folder).then((result) => {
    res.json({
      result,
      message: "Request was successful",
      total: result.length,
    });
  });
});

/*
 * Returns the file that was requested from the TRT folder
 */
app.get("/:folder/download", (req, res) => {
  if (!isAuthenticated(req, res)) {
    return res.json({
      message: "unauthenticated",
    });
  }

  const fileName = req.query.fileName.replace(".src", "");
  const X3Folder = req.params.folder.toUpperCase();

  adx.fetch(X3Folder, fileName).then((data) => {
    res.sendFile(`${ROOT_PATH}/tmp/${data.fileName}.src`);
  });
});

/*
 * Uploads/compiles the file that was received and compiles
 */
app.post("/:folder/upload", upload.single("file"), (req, res) => {
  if (!isAuthenticated(req, res)) {
    return res.json({
      message: "unauthenticated",
    });
  }

  const fileName = req.file.originalname.replace(".src", "");
  const X3Folder = req.params.folder.toUpperCase();

  // Read the file and normalize the line endings to LF
  const fileContent = normalizeNewline(fs.readFileSync(req.file.path, "utf8"));

  // Write the normalized content back to the same file
  fs.writeFileSync(req.file.path, fileContent, "utf8");

  adx.sync(X3Folder, req.file.path, fileName).then((result) => {
    adx.compile(X3Folder, fileName).then((result) => {
      res.json({
        message: "uploaded and compiled",
        result: result,
        host: X3_URL,
      });
    });
  });
});

app.listen(port, () => {
  const startMessage = `Compiler is listening on port: http://localhost:${port}`;
  logger.info(startMessage);
});
