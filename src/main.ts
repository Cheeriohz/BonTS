import "./configurable/constants";

import { GameManager } from "managers/manager.gameManager";
import "./prototypes/RoomVisual"; // Prototypes used in Visualizer class

import { ErrorMapper } from "utils/ErrorMapper";
import * as Profiler from "./Profiler/Profiler";
import _ from "lodash";
_.set(global, "__profiler_enabled__", false);
_.set(global, "__spawn_buffer_ticks__", 10);
_.set(global, "__cycle_long_term__", 100);
_.set(global, "__cycle_medium_term__", 20);
_.set(global, "__cycle_short_term__", 5);

global.pr = Profiler.init();

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
    GameManager.run();
});
