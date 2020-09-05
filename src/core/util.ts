import { App } from "./App";
import { Entity } from "./Entity";

type EntityWithApp = { id: unknown; app: App };

export const hasAppProp = (entity: Entity): entity is EntityWithApp =>
	"app" in entity && (<EntityWithApp>entity).app instanceof App;
