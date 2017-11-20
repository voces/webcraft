
const _isServer = ! new Function( "try {return this===window;}catch(e){ return false;}" )() && ! process.env.isBrowser;

export const isServer = _isServer;
export const isBrowser = ! _isServer;
export const isClient = ! _isServer;
