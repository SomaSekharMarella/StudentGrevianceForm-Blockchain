/**
 * Helper script to extract ABI from compiled contract
 * Usage: node scripts/extract-abi.js
 * 
 * This will output the ABI that can be copied to frontend/app.js
 */

const fs = require('fs');
const path = require('path');

const artifactPath = path.join(__dirname, '../artifacts/contracts/GrievanceSystem.sol/GrievanceSystem.json');

try {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = artifact.abi;
  
  console.log('// Contract ABI - Copy this to frontend/app.js CONTRACT_ABI constant\n');
  console.log('const CONTRACT_ABI = ' + JSON.stringify(abi, null, 2) + ';');
  
  // Also write to a file for easy copying
  const outputPath = path.join(__dirname, '../frontend/contract-abi.json');
  fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
  console.log('\n✅ ABI also saved to frontend/contract-abi.json');
  
} catch (error) {
  console.error('❌ Error: Contract not compiled yet. Run "npm run compile" first.');
  process.exit(1);
}

