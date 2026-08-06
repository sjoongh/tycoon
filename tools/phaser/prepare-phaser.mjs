if (process.env.GAEPYO_STOCK_PHASER === "1") {
  console.log(JSON.stringify({ status: "skipped", reason: "GAEPYO_STOCK_PHASER=1" }));
} else {
  await import("./assert-custom-phaser.mjs");
}
