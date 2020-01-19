import { ErrorMapper } from "utils/ErrorMapper";
import { gameManager } from "managers/manager.gameManager"
import * as Profiler from "./Profiler/Profiler";

global.Profiler = Profiler.init();
global.__PROFILER_ENABLED__ = true;

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  gameManager.run();
});


