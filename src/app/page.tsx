'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useWriteContract, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DynamicConnectButton } from '@dynamic-labs/sdk-react-core';
import { useInvoiceBatching } from '../utils/smartWallet';
import { useMiniKit, useAddFrame, useOpenUrl, useComposeCast } from '@coinbase/onchainkit/minikit';
const CONTRACT_ADDRESS = '0xe22Afa829343049B5AD351423b7F74F3';
const USDC_ADDRESS = '0x036D53842c54266347929541318dCF7';
const BACKEND_URL = 'http://localhost:3001/generate-milestones';

// Import ABI from the compiled contract
import contractABI from '../../abi/InvoiceAgent.json';

// USDC ABI for approval
const USDC_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { writeContract } = useWriteContract();
  const { batchCreateInvoice, isSmartWallet } = useInvoiceBatching();

  // MiniKit hooks for frame-ready flows
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { addFrame } = useAddFrame();
  const openUrl = useOpenUrl();
  const { composeCast } = useComposeCast();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [freelancerAddress, setFreelancerAddress] = useState('');
  const [milestones, setMilestones] = useState<{ name: string; amount: number }[]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS as `0x${string}`,
  });

  const handleGenerate = async () => {
    if (!description || !amount) {
      setError('Please enter project description and amount');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(BACKEND_URL, {
        projectDescription: description,
        totalAmount: amount
      });
      setMilestones(res.data.milestones);
      toast.success('Milestones generated successfully!');
    } catch (err) {
      setError('Failed to generate milestones');
      toast.error('Failed to generate milestones');
      console.error(err);
    }
    setLoading(false);
  };

  const handleApproveUSDC = async () => {
    if (!isConnected || !amount) {
      toast.error('Please connect wallet and enter amount');
      return;
    }

    try {
      setLoading(true);
      const amountInWei = parseUnits(amount.toString(), 6); // USDC has 6 decimals
      
      await writeContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS as `0x${string}`, amountInWei],
      });
      
      toast.success('USDC approved successfully!');
    } catch (err) {
      toast.error('USDC approval failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!isConnected || !freelancerAddress) {
      setError('Please connect wallet and enter freelancer address');
      return;
    }

    if (!milestones || milestones.length === 0) {
      setError('Please generate milestones first');
      return;
    }

    try {
      setLoading(true);
      const milestoneNames = milestones.map(m => m.name);
      const milestoneAmounts = milestones.map(m => parseUnits(m.amount.toString(), 6)); // USDC decimals=6

      if (isSmartWallet) {
        // Use Smart Wallet batching for better UX
        await batchCreateInvoice(
          USDC_ADDRESS as `0x${string}`,
          CONTRACT_ADDRESS as `0x${string}`,
          freelancerAddress as `0x${string}`,
          amount,
          milestoneNames,
          milestoneAmounts,
          description
        );
        toast.success('Invoice created with Smart Wallet batching! 🚀');
      } else {
        // Fallback to regular transaction
        await writeContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: contractABI.abi,
          functionName: 'createInvoice',
          args: [freelancerAddress as `0x${string}`, parseUnits(amount.toString(), 6), milestoneNames, milestoneAmounts, description],
        });
        toast.success('Invoice created successfully!');
      }
      
      setMilestones(undefined);
      setDescription('');
      setAmount(0);
      setFreelancerAddress('');
    } catch (err) {
      toast.error('Failed to create invoice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnramp = () => {
    if (!address) {
      toast.error('Please connect wallet first');
      return;
    }

    if ((window as any).coinbaseOnramp) {
      const neededAmount = amount - Number(usdcBalance?.formatted || 0);
      (window as any).coinbaseOnramp.init({
        apiKey: 'YOUR_CDP_ONRAMP_KEY', // Replace with actual key
        destination: address,
        asset: 'USDC',
        network: 'base-sepolia',
        amount: neededAmount.toString(),
        onSuccess: (tx: any) => {
          toast.success('USDC purchased successfully!');
          console.log('Onramp Success:', tx);
        },
        onError: (err: any) => {
          toast.error('USDC purchase failed');
          console.error('Onramp Error:', err);
        },
      });
    } else {
      toast.error('Onramp SDK not loaded');
    }
  };

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady(); // Signal app is ready for frame display
    }
  }, [isFrameReady, setFrameReady]);

  // Example: Add frame to user's wallet (for saving invoices)
  const handleSaveInvoiceAsFrame = async () => {
    if (!milestones || milestones.length === 0) {
      toast.error('Please generate milestones first');
      return;
    }

    try {
      const result = await addFrame();
      if (result) {
        // Use result.token/url for notifications
        toast.success('Invoice saved as frame! Share it on Farcaster! 🎉');
      }
    } catch (error) {
      toast.error('Failed to save as frame');
      console.error(error);
    }
  };

  // Example: Share invoice on Farcaster
  const handleShareInvoice = () => {
    if (!milestones || milestones.length === 0) {
      toast.error('Please generate milestones first');
      return;
    }

    try {
      composeCast({
        text: `Just created an onchain freelance invoice with AI! ${milestones.length} milestones generated. #BuildOnBase #FreelanceAI`,
        embeds: [`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:34'}/dashboard`], // Embed your dashboard
      });
      toast.success('Shared on Farcaster! 🚀');
    } catch (error) {
      toast.error('Failed to share on Farcaster');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <ToastContainer />
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🚀 Freelance Invoice AI on Base</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automate your freelance payments with AI-powered milestone generation and Smart Wallet technology
          </p>
          {isSmartWallet && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <span className="mr-2">✨</span>
              Smart Wallet Connected - Gasless & Batched Transactions Available
            </div>
          )}
          {context?.isFrame && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              <span className="mr-2">📱</span>
              Running in Coinbase Wallet Frame
            </div>
          )}
        </div>
        
        {!isConnected ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Connect Your Wallet</h2>
              <div className="space-y-4">
                <div>
                  <ConnectButton>
                    Connect with any wallet
                  </ConnectButton>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
                <div>
                  <DynamicConnectButton 
                    buttonClassName="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-105"
                  >
                    Connect with Coinbase Smart Wallet
                  </DynamicConnectButton>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8">        {/* Wallet Info */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Connected Address</p>
                  <p className="font-mono text-sm text-gray-900">{address}</p>
                </div>
                {usdcBalance && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">USDC Balance</p>
                    <p className="font-semibold text-green-600">{formatUnits(usdcBalance.value, 6)} USDC</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <input
                  placeholder="e.g., Design a logo for a tech startup"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total USDC Amount
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Freelancer Address
                  </label>
                  <input
                    placeholder="0x..."
                    value={freelancerAddress}
                    onChange={e => setFreelancerAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleGenerate} 
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? '🤖 Generating...' : '🤖 Generate Milestones'}
                </button>
                
                <button 
                  onClick={handleApproveUSDC}
                  disabled={loading || !amount}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? 'Approve USDC' : '✅ Approve USDC'}
                </button>
                
                <button 
                  onClick={handleOnramp}
                  disabled={loading || !address}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  💳 Buy USDC
                </button>
              </div>
              
              {/* Create Invoice Button */}
              {milestones && milestones.length > 0 && (
                <div className="mt-6">
                  <button 
                    onClick={handleCreate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating Invoice...' : `🚀 Create Invoice (${milestones.length} milestones)`}
                  </button>
                </div>
              )}
              
              {/* MiniKit Social Features */}
              {milestones && milestones.length > 0 && (
                <div className="mt-6 flex gap-4">
                  <button 
                    onClick={handleSaveInvoiceAsFrame}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-105"
                  >
                    📱 Save as Frame
                  </button>
                  <button 
                    onClick={handleShareInvoice}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-105"
                  >
                    🐘 Share on Farcaster
                  </button>
                  <button 
                    onClick={() => openUrl('https://sepolia.basescan.org/address/0xe22fa8293430495D351423b7F74F3')}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    🔍 View on Basescan
                  </button>
                </div>
              )}
              
              {/* Milestones Display */}
              {milestones && milestones.length > 0 && (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Milestones</h3>
                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                        <span className="font-medium">{milestone.name}</span>
                        <span className="text-green-600 font-semibold">{milestone.amount} USDC</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 