import express, { NextFunction, Request, Response } from "express";
const app = express();
import multer, { Multer } from "multer";
import bodyParser from "body-parser";
import { pino as createLogger } from "pino";
const logger = createLogger();
import fs from "fs";
import normalizeNewline from "normalize-newline";
import dotenv from "dotenv";
dotenv.config();

import { dirname } from "path";
import { fileURLToPath } from "url";

// tslint:disable-next-line: variable-name
const __dirname = dirname(fileURLToPath(import.meta.url));

// Default paths
const upload: Multer = multer({ dest: "tmp/" });
const X3_PATH: string = process.env.X3_PATH ?? '';
const ROOT_PATH: string = __dirname;
const X3_URL: string = process.env.X3_URL ?? '';

const port: string = process.env.PORT ?? '';

import Adonix from "./Adonix.js";
const adx = new Adonix(X3_PATH, ROOT_PATH);

app.use(bodyParser.json());

if (process.env.ENV === "DEV") {
    app.use((req: Request, _, next: NextFunction) => {
        logger.info(req);
        next();
    });
}

const isAuthenticated = (req: Request, _: any) => {
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
app.get("/", (_: Request, res: Response) => {
    res.json({
        message: "working",
    });
});

/*
* Returns file names in TRT folder
*/
app.get("/:folder/files", (req: Request, res: Response) => {
    const x3Folder: string = req.params.hasOwnProperty('folder')
        ? req.params.folder.toUpperCase()
        : '';

        if (!isAuthenticated(req, res)) {
            return res.json({
                message: "unauthenticated",
            });
        }

        return adx.files(x3Folder).then((result: string) => {
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
app.get("/:folder/download", (req: Request, res: Response) => {
    if (!isAuthenticated(req, res)) {
        return res.json({
            message: "unauthenticated",
        });
    }

    const fileName: string = req.query.hasOwnProperty('fileName')
        ? (req.query.fileName as string).replace(".src", "")
        : '';

    const x3Folder = req.params.hasOwnProperty('folder')
        ? req.params.folder.toUpperCase()
        : '';

    return adx.fetch(x3Folder, fileName).then((data: FetchResult) => {
        res.sendFile(`${ROOT_PATH}/tmp/${data.fileName}.src`);
    });
});

/*
    * Uploads/compiles the file that was received and compiles
*/
app.post("/:folder/upload", upload.single("file"), (req: Request, res: Response) => {
    if (!isAuthenticated(req, res)) {
        return res.json({
            message: "unauthenticated",
        });
    }

    if (!req.file) {
        return res.json({
            message: "No file was uploaded",
        });
    }

    const fileName: string = req.file.originalname.replace(".src", "");
    const x3Folder: string = req.params.hasOwnProperty('folder')
        ? req.params.folder.toUpperCase()
        : '';

    // Read the file and normalize the line endings to LF
    const fileContent = normalizeNewline(fs.readFileSync(req.file.path, "utf8"));

    // Write the normalized content back to the same file
    fs.writeFileSync(req.file.path, fileContent, "utf8");

    return adx.sync(x3Folder, req.file.path, fileName).then(() => {
        adx.compile(x3Folder, fileName).then((result) => {
            res.json({
                message: "uploaded and compiled",
                result,
                host: X3_URL,
            });
        });
    });
});

app.listen(port, () => {
    const startMessage = `Compiler is listening on port: http://localhost:${port}`;
        logger.info(startMessage);
});
