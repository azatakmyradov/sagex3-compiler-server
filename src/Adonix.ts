import Command from "./Command.js";

export default class Adonix {

    x3Path: string;

    foldersPath: string;

    rootPath: string;

    /*
    * Constructor
    */
    constructor(x3Path: string, rootPath: string) {
        this.x3Path = x3Path;
        this.foldersPath = `${x3Path}\\folders`;
        this.rootPath = rootPath;
    }

    /*
    * Returns files in the TRT folder
    */
    async files(folder: string): Promise<string> {
        // command: cd C:\example\folder && dir
        const command: string = `cd ${this.foldersPath}\\${folder}\\TRT && dir`;

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
        const command = `cd ${this.x3Path}\\runtime && bin\\env.bat && bin\\valtrt ${folder} ${fileName}`;

        return Command.execute(command, (result: string) => {
            return result;
        });
    }

    /*
    * Fetch file from X3
    */
    fetch(folder: string, fileName: string): Promise<FetchResult> {
        // command: xcopy C:\PATH_TO_X3\folders\Folder\TRT\EXAMPLE.src C:\NODE_PROJECT\tmp -Y
        const command = `xcopy ${this.foldersPath}\\${folder}\\TRT\\${fileName}.src ${this.rootPath}\\tmp\\ /Y`;

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
        const command = `move ${this.rootPath}\\${target} ${this.foldersPath}\\${folder}\\TRT\\${destination}.src`;

        return Command.execute(command, (result: string) => {
            return {
                result,
            };
        });
    }
}
