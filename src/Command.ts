import { exec } from "child_process";

import { pino as createLogger } from "pino";
const logger = createLogger();

export default class Command {
    /*
    * Run system commands
    */
    static execute(command: string, callback: CallableFunction): Promise<any> {
        return new Promise((resolve, _) => {
            exec(
                command,
                { maxBuffer: 1024 * 5000 },
                (error, stdout, stderr) => {
                    const result: any = callback(stdout);

                    logger.error(error);
                    logger.info(stderr);

                    resolve(result);
                }
            );
        });
    }
}
