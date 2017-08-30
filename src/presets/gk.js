
// Global-Knowledge (GK) : All players know everything
//  - Fit for small classic games like Pong & Tron

import * as eventSystem from "./events/gkEventSystem.js";
import ClientNetwork from "./networks/GenericClient.js";
import ServerNetwork from "./networks/GenericServer.js";
import renderer from "./misc/Renderer.js";

export { eventSystem, ClientNetwork, ServerNetwork, renderer };
