// import { theGap } from "./theGap";
// import { theRock } from "./theRock";
// import { theTamedWoods } from "./theTamedWoods";
// import { theTarget } from "./theTarget";
// import { theTinyRectangle } from "./theTinyRectangle";
// import { theWoods } from "./theWoods";
import { processArena } from "../../engine/entities/terrainHelpers";
import { theDump } from "./theDump";
import { theFarm } from "./theFarm";

export const arenas = [
	theDump,
	theFarm,
	// theGap,
	// theRock,
	// theTamedWoods,
	// theTarget,
	// theTinyRectangle,
	// theWoods,
].map(processArena);
