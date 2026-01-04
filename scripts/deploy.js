const hre = require("hardhat");

/**
 * Deployment script for GrievanceSystem contract
 * Usage: npx hardhat run scripts/deploy.js --network sepolia
 */
async function main() {
  console.log("🚀 Deploying GrievanceSystem contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contract with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const GrievanceSystem = await hre.ethers.getContractFactory("GrievanceSystem");
  const grievanceSystem = await GrievanceSystem.deploy();

  await grievanceSystem.waitForDeployment();
  const contractAddress = await grievanceSystem.getAddress();

  console.log("✅ GrievanceSystem deployed to:", contractAddress);
  console.log("📋 Contract address (save this for frontend):", contractAddress);

  // Optional: Assign initial authorities (uncomment and add addresses)
  // console.log("\n🔐 Assigning initial authorities...");
  // await grievanceSystem.assignAuthority("0x...", 0); // COUNSELOR
  // await grievanceSystem.assignAuthority("0x...", 1); // YEAR_COORD
  // await grievanceSystem.assignAuthority("0x...", 2); // HOD
  // await grievanceSystem.assignAuthority("0x...", 3); // DEAN
  // console.log("✅ Authorities assigned");

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
  console.log("1. Update frontend/app.js with contract address:", contractAddress);
  console.log("2. Assign authorities using assignAuthority() function");
  console.log("3. Connect MetaMask to frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

