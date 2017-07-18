import { CommandLine } from "./commandline";
import { ApiServer } from "./apiServer";

export class Setup {

    public static run(): void {

        CommandLine.init();

        ApiServer.startListening();

    }
}

