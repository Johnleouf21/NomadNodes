import { expect } from "chai";
import { network } from "hardhat";
import type { MockERC20 } from "../types/ethers-contracts";

const { ethers } = await network.connect();

describe("MockERC20", function () {
  let token: MockERC20;
  let user: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user2: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  // Faucet amount: 10,000 tokens with 6 decimals
  const FAUCET_AMOUNT = 10_000n * 1_000_000n;

  beforeEach(async function () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_owner, _user, _user2] = await ethers.getSigners();
    user = _user;
    user2 = _user2;

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    token = (await MockERC20Factory.deploy("Test Token", "TEST", 6)) as unknown as MockERC20;
  });

  describe("Basic ERC20", function () {
    it("should return correct decimals", async function () {
      expect(await token.decimals()).to.equal(6);
    });

    it("should mint tokens", async function () {
      const amount = ethers.parseUnits("1000", 6);
      await token.mint(user.address, amount);

      expect(await token.balanceOf(user.address)).to.equal(amount);
    });

    it("should burn tokens", async function () {
      const amount = ethers.parseUnits("1000", 6);
      await token.mint(user.address, amount);

      await token.burn(user.address, amount / 2n);

      expect(await token.balanceOf(user.address)).to.equal(amount / 2n);
    });
  });

  describe("Faucet", function () {
    it("should have correct FAUCET_AMOUNT constant", async function () {
      expect(await token.FAUCET_AMOUNT()).to.equal(FAUCET_AMOUNT);
    });

    it("should allow first-time claim from faucet", async function () {
      await expect(token.connect(user).faucet())
        .to.emit(token, "FaucetClaimed")
        .withArgs(user.address, FAUCET_AMOUNT);

      expect(await token.balanceOf(user.address)).to.equal(FAUCET_AMOUNT);
    });

    it("should mark address as claimed after faucet", async function () {
      expect(await token.hasClaimed(user.address)).to.be.false;
      expect(await token.canClaim(user.address)).to.be.true;

      await token.connect(user).faucet();

      expect(await token.hasClaimed(user.address)).to.be.true;
      expect(await token.canClaim(user.address)).to.be.false;
    });

    it("should revert on second claim attempt", async function () {
      await token.connect(user).faucet();

      await expect(token.connect(user).faucet()).to.be.revertedWith("Already claimed from faucet");
    });

    it("should allow different users to claim", async function () {
      await token.connect(user).faucet();
      await token.connect(user2).faucet();

      expect(await token.balanceOf(user.address)).to.equal(FAUCET_AMOUNT);
      expect(await token.balanceOf(user2.address)).to.equal(FAUCET_AMOUNT);
    });

    it("should not affect mint functionality", async function () {
      // User claims from faucet
      await token.connect(user).faucet();
      expect(await token.balanceOf(user.address)).to.equal(FAUCET_AMOUNT);

      // Owner can still mint additional tokens to user
      const additionalAmount = ethers.parseUnits("5000", 6);
      await token.mint(user.address, additionalAmount);

      expect(await token.balanceOf(user.address)).to.equal(FAUCET_AMOUNT + additionalAmount);
    });

    it("should return correct canClaim for addresses", async function () {
      // Before claiming
      expect(await token.canClaim(user.address)).to.be.true;
      expect(await token.canClaim(user2.address)).to.be.true;

      // After user claims
      await token.connect(user).faucet();
      expect(await token.canClaim(user.address)).to.be.false;
      expect(await token.canClaim(user2.address)).to.be.true;

      // After user2 claims
      await token.connect(user2).faucet();
      expect(await token.canClaim(user.address)).to.be.false;
      expect(await token.canClaim(user2.address)).to.be.false;
    });
  });
});
