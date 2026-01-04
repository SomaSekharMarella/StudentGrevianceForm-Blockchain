const hre = require("hardhat");

/**
 * Deployment script for GrievanceSystemSecure contract
 * Usage: npx hardhat run scripts/deploySecure.js --network sepolia
 */
async function main() {
  console.log("🔒 Deploying GrievanceSystemSecure contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contract with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const GrievanceSystemSecure = await hre.ethers.getContractFactory("GrievanceSystemSecure");
  const grievanceSystem = await GrievanceSystemSecure.deploy();

  await grievanceSystem.waitForDeployment();
  const contractAddress = await grievanceSystem.getAddress();

  console.log("✅ GrievanceSystemSecure deployed to:", contractAddress);
  console.log("📋 Contract address (save this for frontend):", contractAddress);
  console.log("🔐 Deployer is automatically set as ADMIN");

  // Wait for block confirmations on mainnet/testnet
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await grievanceSystem.deploymentTransaction().wait(5);
    console.log("✅ Contract confirmed");

    // Verify contract on Etherscan (optional)
    if (hre.network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
      console.log("\n🔍 Verifying contract on Etherscan...");
      try {
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: [],
        });
        console.log("✅ Contract verified on Etherscan");
      } catch (error) {
        console.log("❌ Verification failed:", error.message);
      }
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Update frontend/appSecure.js with contract address:", contractAddress);
  console.log("2. Use admin panel to assign roles (deployer is admin)");
  console.log("3. Connect MetaMask to frontend");
  console.log("\n🔐 SECURITY NOTES:");
  console.log("- Only deployer can assign roles");
  console.log("- Only STUDENT role can submit grievances");
  console.log("- HODs can only see assigned grievances");
  console.log("- All access control enforced on-chain");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

