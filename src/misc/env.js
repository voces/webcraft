
export const isBrowser = new Function( "try {return this===window;}catch(e){ return false;}" )();
export const isClient = new Function( "try {return this===window;}catch(e){ return false;}" )();
export const isServer = ! new Function( "try {return this===window;}catch(e){ return false;}" )();
