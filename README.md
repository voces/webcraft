# WebCraft #

### HTML5 Game Engine & Editor ###

The aim of WebCraft is to provide an intuitive and simple environment to both play and create games with a community of other players. WebCraft is the client-facing portion of this project and includes a portal that has channels, clans, and friends, and engine for hosting and playing games, and an editor to create games.

The other portions of the project include Nova and WCHost. Nova is the server that allows clients to interact. It handles client authentication, channels (groups), and managing a list of hosted games (lobbies). WCHost is a tool for clients to use that allows them to host their own games (lobbies) on a local computer (or a VPS). Both of these products require Node.js.

### Usage ###

A local deployment of WebCraft is not necessary for clients, as they are expected to use a centralized or privately hosted copy on any webserver. However, a local deployment can be done so as to increase load speed, specifically for any large files such as textures and models.

To run it locally, simply placed the entire directory in a webserver. The project does not require PHP or any server-side processing. The project must be hosted by a webserver due to same-origin policy issues.
