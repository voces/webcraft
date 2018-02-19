
// Global-Knowledge (GK) : All players know everything
//  - Fit for small classic games like Pong & Tron

import eventSystem from "./events/gkEventSystem.js";
import ClientNetwork from "./networks/GenericClient.js";
import ServerNetwork from "./networks/GenericServer.js";
import renderer from "./misc/Renderer.js";

const state = app => ( { players: app.players, units: app.units, doodads: app.doodads } );

export { eventSystem, ClientNetwork, ServerNetwork, renderer, state };
