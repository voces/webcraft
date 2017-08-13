
// Global-Knowledge (GK) : All players know everything
//  - Fit for small classic games like Pong & Tron

import * as eventSystem from "./events/gkEventSystem.js";
import ClientNetwork from "./networks/GenericClientNetwork.js";
import ServerNetwork from "./networks/GenericServerNetwork.js";
import renderer from "./misc/Renderer.js";

export { eventSystem, ClientNetwork, ServerNetwork, renderer };
