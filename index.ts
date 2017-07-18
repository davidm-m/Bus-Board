import { Setup } from './workspace/setup'

export class Index {
    public static main(): number {
        Setup.run();

        return 0;
    }
}

Index.main();