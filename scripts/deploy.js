const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const HelloWorld = await hre.ethers.getContractFactory("HelloWorld");
  const helloWorld = await HelloWorld.deploy();
  await helloWorld.waitForDeployment();

  console.log("HelloWorld deployed to:", await helloWorld.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
