#!/usr/bin/env node

const { main } = require("./lib");

if (require.main === module) {
  const args = process.argv.slice(2);
  main(args).then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}