import { useDynamicContext } from @dynamic-labs/sdk-react-core';
import [object Object]useWriteContract } fromwagmi';
import { parseUnits } fromviem;

// Smart Wallet batching utility
export const useSmartWalletBatch = () => {
  const[object Object] primaryWallet } = useDynamicContext();
  const[object Object] writeContract } = useWriteContract();

  // Batch multiple transactions into a single Smart Wallet transaction
  const batchTransactions = async (transactions: Array<[object Object]    address: `0x$[object Object]string}`;
    abi: any;
    functionName: string;
    args: any
  }>) => [object Object]if (!primaryWallet)[object Object]   throw new Error('Smart Wallet not connected);
    }

    try {
      // Use Smart Wallet's batching capability
      const batchTx = await primaryWallet.batch(transactions);
      return batchTx;
    } catch (error) {
      console.error(Batchtransaction failed:', error);
      throw error;
    }
  };

  // Gasless transaction wrapper
  const gaslessTransaction = async (transaction: [object Object]    address: `0x$[object Object]string}`;
    abi: any;
    functionName: string;
    args: any[];
  }) => [object Object]if (!primaryWallet)[object Object]   throw new Error('Smart Wallet not connected);
    }

    try {
      // Use Smart Wallet's gasless capability
      const gaslessTx = await primaryWallet.gasless(transaction);
      return gaslessTx;
    } catch (error) {
      console.error('Gasless transaction failed:', error);
      throw error;
    }
  };

  return {
    batchTransactions,
    gaslessTransaction,
    isSmartWallet: !!primaryWallet,
  };
};

// Invoice-specific batching operations
export const useInvoiceBatching = () => {
  const { batchTransactions, gaslessTransaction, isSmartWallet } = useSmartWalletBatch();

  // Batch USDC approval + invoice creation
  const batchCreateInvoice = async (
    usdcAddress: `0x${string}`,
    contractAddress: `0x${string}`,
    freelancerAddress: `0x${string}`,
    amount: number,
    milestoneNames: string[],
    milestoneAmounts: bigint[],
    description: string
  ) => {
    const usdcApproval = {
      address: usdcAddress,
      abi: [
        [object Object]
          inputs: [
            { internalType: address', name: spender, type: 'address },        { internalType: uint256, name:amount,type: 'uint256      ],
          name: 'approve',
          outputs: [{ internalType:bool, name:  type: 'bool' }],
          stateMutability: 'nonpayable,
          type: function'
        }
      ],
      functionName: 'approve',
      args: [contractAddress, parseUnits(amount.toString(), 6)],
    };

    const createInvoice = {
      address: contractAddress,
      abi: [
        [object Object]
          inputs: [
            { internalType: 'address', name: '_freelancer, type: 'address },        { internalType: 'uint256ame: '_totalAmount, type: 'uint256 },        { internalType:string[]', name: _milestoneNames, type: 'string },        { internalType: uint256 name: _milestoneAmounts', type: 'uint256 },        { internalType: string, name: projectDescription', type: 'string' }
          ],
          name:createInvoice',
          outputs: [],
          stateMutability: 'nonpayable,
          type: function'
        }
      ],
      functionName:createInvoice',
      args: freelancerAddress, parseUnits(amount.toString(), 6), milestoneNames, milestoneAmounts, description],
    };

    return await batchTransactions([usdcApproval, createInvoice]);
  };

  // Gasless milestone completion
  const gaslessCompleteMilestone = async (
    contractAddress: `0x${string}`,
    invoiceId: number,
    milestoneIndex: number
  ) => [object Object]  return await gaslessTransaction({
      address: contractAddress,
      abi: [
        [object Object]
          inputs: [
            { internalType: 'uint256, name: _invoiceId, type: 'uint256 },        { internalType: 'uint256', name: _milestoneIndex,type: 'uint256      ],
          name: completeMilestone',
          outputs: [],
          stateMutability: 'nonpayable,
          type: function'
        }
      ],
      functionName: completeMilestone',
      args:BigInt(invoiceId), BigInt(milestoneIndex)],
    });
  };

  return[object Object]batchCreateInvoice,
    gaslessCompleteMilestone,
    isSmartWallet,
  };
}; 