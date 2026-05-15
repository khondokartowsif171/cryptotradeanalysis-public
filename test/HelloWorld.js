const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("HelloWorld", function () {
  async function deployHelloWorldFixture() {
    // Get signers
    const [owner, otherAccount] = await ethers.getSigners();

    // Deploy HelloWorld
    const HelloWorld = await ethers.getContractFactory("HelloWorld");
    const helloWorld = await HelloWorld.deploy();

    return { helloWorld, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { helloWorld, owner } = await loadFixture(deployHelloWorldFixture);
      expect(await helloWorld.owner()).to.equal(owner.address);
    });

    it("Should have initial greeting 'Hello World!'", async function () {
      const { helloWorld } = await loadFixture(deployHelloWorldFixture);
      expect(await helloWorld.getGreeting()).to.equal("Hello World!");
    });
  });

  describe("Greeting Management", function () {
    it("Should allow setting a new greeting", async function () {
      const { helloWorld } = await loadFixture(deployHelloWorldFixture);
      const newGreeting = "Hello, Blockchain!";

      await helloWorld.setGreeting(newGreeting);
      expect(await helloWorld.getGreeting()).to.equal(newGreeting);
    });

    it("Should emit GreetingChanged event when greeting is updated", async function () {
      const { helloWorld, owner } = await loadFixture(deployHelloWorldFixture);
      const newGreeting = "Hello, Smart Contracts!";

      await expect(helloWorld.setGreeting(newGreeting))
        .to.emit(helloWorld, "GreetingChanged")
        .withArgs(newGreeting, owner.address);
    });

    it("Should allow anyone to set a greeting", async function () {
      const { helloWorld, otherAccount } = await loadFixture(deployHelloWorldFixture);
      const newGreeting = "Hello from another account!";

      await expect(helloWorld.connect(otherAccount).setGreeting(newGreeting))
        .to.emit(helloWorld, "GreetingChanged")
        .withArgs(newGreeting, otherAccount.address);

      expect(await helloWorld.getGreeting()).to.equal(newGreeting);
    });

    it("Should handle empty string greeting", async function () {
      const { helloWorld } = await loadFixture(deployHelloWorldFixture);
      const emptyGreeting = "";

      await helloWorld.setGreeting(emptyGreeting);
      expect(await helloWorld.getGreeting()).to.equal(emptyGreeting);
    });

    it("Should handle long greeting messages", async function () {
      const { helloWorld } = await loadFixture(deployHelloWorldFixture);
      const longGreeting = "This is a very long greeting message that tests how the contract handles larger strings and ensures there are no issues with gas limits or storage constraints when dealing with longer text inputs.";

      await helloWorld.setGreeting(longGreeting);
      expect(await helloWorld.getGreeting()).to.equal(longGreeting);
    });
  });

  describe("Multiple Greeting Changes", function () {
    it("Should maintain the latest greeting after multiple changes", async function () {
      const { helloWorld } = await loadFixture(deployHelloWorldFixture);

      const greetings = [
        "First greeting",
        "Second greeting",
        "Third greeting",
        "Final greeting"
      ];

      for (const greeting of greetings) {
        await helloWorld.setGreeting(greeting);
        expect(await helloWorld.getGreeting()).to.equal(greeting);
      }
    });

    it("Should emit events for each greeting change", async function () {
      const { helloWorld, owner } = await loadFixture(deployHelloWorldFixture);

      const greeting1 = "First change";
      const greeting2 = "Second change";

      await expect(helloWorld.setGreeting(greeting1))
        .to.emit(helloWorld, "GreetingChanged")
        .withArgs(greeting1, owner.address);

      await expect(helloWorld.setGreeting(greeting2))
        .to.emit(helloWorld, "GreetingChanged")
        .withArgs(greeting2, owner.address);
    });
  });
});
