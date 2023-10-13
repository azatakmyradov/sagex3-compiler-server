import Command from "./Command.js";
import { escapeShell } from "./helpers.js";

export default class Adonix {

    x3Path: string;

    foldersPath: string;

    rootPath: string;

    /*
    * Constructor
    */
    constructor(x3Path: string, rootPath: string) {
        this.x3Path = x3Path;
        this.foldersPath = `${x3Path}/folders`;
        this.rootPath = rootPath;
    }

    /*
    * Returns files in the TRT folder
    */
    async files(folder: string): Promise<string> {
        // command: cd C:\example\folder && dir
        const path = escapeShell(`${this.foldersPath}/${folder}/TRT`);
        const command: string = `cd ${path} && dir`;

        // fetch file names from TRT folder excluding one starting with "W"
        const files = await Command.execute(command, (response: string) => {
            const files = response
                .split(" ")
                .filter((file) => file.match(/\b(?!W)[A-Z][A-Za-z0-9_]*\.src\b/))
                .map((file) => file.split("src")[0] + "src");

            return files;
        });

        return files;
    }

    /*
    * Compiles the file in TRT folder
    */
    compile(folder: string, fileName: string) {
        // command: cd C:\X3Path-here\runtime && bin\env.bat && bin\valtrt SEED EXAMPLE.src
        const path = escapeShell(`${this.x3Path}/runtime`);
        const envBat = escapeShell(`bin/env.bat`);
        const valtrt = escapeShell(`bin/valtrt`);
        const command = `cd ${path} && ${envBat} && ${valtrt} ${folder} ${fileName}`;

        return Command.execute(command, (result: string) => {
            return result;
        });
    }

    /*
    * Fetch file from X3
    */
    fetch(folder: string, fileName: string): Promise<FetchResult> {
        // command: xcopy C:\PATH_TO_X3\folders\Folder\TRT\EXAMPLE.src C:\NODE_PROJECT\tmp -Y
        const origin = escapeShell(`${this.foldersPath}/${folder}/TRT/${fileName}.src`);
        const destination = escapeShell(`${this.rootPath}/tmp/`);
        const command = `xcopy ${origin} ${destination} /Y`;

        return Command.execute(command, (result: string): FetchResult  => {
            const returnResult: FetchResult = {
                result,
                fileName,
            }

            return returnResult;
        });
    }

    /*
    * Upload file from user to TRT folder
    */
    sync(folder: string, target: string, destination: string) {
        // command: move C:\NODE_PROJECT\tmp C:\PATH_TO_X3\folders\Folder\TRT\EXAMPLE.src
        const origin = escapeShell(`${this.rootPath}/${target}`);
        const destinationPath = escapeShell(`${this.foldersPath}/${folder}/TRT/${destination}.src`);
        const command = `move ${origin} ${destinationPath}`;

        return Command.execute(command, (result: string) => {
            return {
                result,
            };
        });
    }
}
