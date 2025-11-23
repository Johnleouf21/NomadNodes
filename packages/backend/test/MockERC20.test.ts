import { expect } from "chai";
import { network } from "hardhat";
import type { MockERC20 } from "../types/ethers-contracts";

const { ethers } = await network.connect();

describe("MockERC20", function () {
  let token: MockERC20;
  let user: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_owner, _user] = await ethers.getSigners();
    user = _user;

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    token = (await MockERC20Factory.deploy("Test Token", "TEST", 6)) as unknown as MockERC20;
  });

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
