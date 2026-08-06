const Phaser = require("phaser/src/phaser-core.js");

// phaser-core intentionally exposes a small Math surface; state normalization also needs Clamp.
Phaser.Math.Clamp = require("phaser/src/math/Clamp.js");

// Factories used by PreloadScene and WorldView but not registered by phaser-core.
require("phaser/src/gameobjects/shape/rectangle/RectangleFactory.js");
require("phaser/src/gameobjects/shape/arc/ArcFactory.js");
require("phaser/src/gameobjects/zone/ZoneFactory.js");

module.exports = Phaser;
