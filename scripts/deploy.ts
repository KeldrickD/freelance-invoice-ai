import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Deploying InvoiceAgent contract...");

  // USDC addresses on Base
  const USDC_ADDRESSES = {
    baseSepolia: "0x036CbD53842c5426634e7929541eC2318bd7e0D0", // Base Sepolia testnet USDC
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base mainnet USDC
  };

  // Get the network name
  const network = await ethers.provider.getNetwork();
  const networkName = network.chainId === 84532 ? "baseSepolia" : "base";
  
  const usdcAddress = USDC_ADDRESSES[networkName as keyof typeof USDC_ADDRESSES];
  
  console.log(`Deploying to ${networkName} with USDC address: ${usdcAddress}`);

  // Deploy the contract
  const InvoiceAgent = await ethers.getContractFactory("InvoiceAgent");
  const invoiceAgent = await InvoiceAgent.deploy(usdcAddress);

  await invoiceAgent.waitForDeployment();
  const contractAddress = await invoiceAgent.getAddress();

  console.log("InvoiceAgent deployed to:", contractAddress);
  console.log("Network:", networkName);
  console.log("USDC Address:", usdcAddress);

  // Verify the contract on Basescan
  console.log("\nTo verify the contract on Basescan, run:");
  console.log(`npx hardhat verify --network ${networkName} ${contractAddress} "${usdcAddress}"`);

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    contractAddress,
    usdcAddress,
    deployer: await ethers.provider.getSigner().getAddress(),
    timestamp: new Date().toISOString(),
  };

  console.log("\nDeployment Info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 