import Command from "./Command.js";

export default class Adonix {
  /*
   * Constructor
   *
   * @param x3_path X3 Path on the server
   * @param root_path NodeJS root path
   */
  constructor(x3_path, root_path) {
    this.x3_path = x3_path;
    this.folders_path = `${x3_path}\\folders`;
    this.root_path = root_path;
  }

  /*
   * Returns files in the TRT folder
   *
   * @param folder Folder name
   */
  async files(folder) {
    // command: cd C:\example\folder && dir
    const command = `cd ${this.folders_path}\\${folder}\\TRT && dir`;

    // fetch file names from TRT folder excluding one starting with "W"
    const files = await Command.execute(command, function (response) {
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
   *
   * @param folder X3Folder name
   * @param fileName SRC file to compile
   */
  compile(folder, fileName) {
    // command: cd C:\X3Path-here\runtime && bin\env.bat && bin\valtrt SEED EXAMPLE.src
    const command = `cd ${this.x3_path}\\runtime && bin\\env.bat && bin\\valtrt ${folder} ${fileName}`;

    return Command.execute(command, function (result) {
      return result;
    });
  }

  /*
   * Fetch file from X3
   *
   * @param folder X3 Folder name
   * @param fileName SRC file to fetch
   */
  fetch(folder, fileName) {
    // command: xcopy C:\PATH_TO_X3\folders\Folder\TRT\EXAMPLE.src C:\NODE_PROJECT\tmp -Y
    const command = `xcopy ${this.folders_path}\\${folder}\\TRT\\${fileName}.src ${this.root_path}\\tmp\\ /Y`;

    return Command.execute(command, function (result) {
      return {
        result: result,
        fileName: fileName,
      };
    });
  }

  /*
   * Upload file from user to TRT folder
   *
   * @param folder X3 Folder name
   * @param target File being uploaded
   * @param destination Path where the file will be uploaded
   */
  sync(folder, target, destination) {
    // command: move C:\NODE_PROJECT\tmp C:\PATH_TO_X3\folders\Folder\TRT\EXAMPLE.src
    const command = `move ${this.root_path}\\${target} ${this.folders_path}\\${folder}\\TRT\\${destination}.src`;

    console.log(command);

    return Command.execute(command, function (result) {
      return {
        result: result,
      };
    });
  }
}
