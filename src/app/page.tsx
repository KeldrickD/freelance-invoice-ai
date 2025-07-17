'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DynamicConnectButton } from '@dynamic-labs/sdk-react-core';
import { useMiniKit, useAddFrame, useOpenUrl, useComposeCast } from '@coinbase/onchainkit/minikit';
const CONTRACT_ADDRESS = '0xe22Afa829343049B5AD351423b7F74F3';
const USDC_ADDRESS = '0x036D53842c54266347929541318dCF7';

interface Milestone {
  name: string;
  amount: number;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  
  // MiniKit hooks for Coinbase Mini App features
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { addFrame } = useAddFrame();
  const openUrl = useOpenUrl();
  const { composeCast } = useComposeCast();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [freelancerAddress, setFreelancerAddress] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>();
  const [loading, setLoading] = useState(false);

  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS as `0x${string}`,
  });

  // Signal app is ready for frame display
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  const handleGenerate = async () => {
    if (!description || amount <= 0) {
      toast.error('Please provide description and amount');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:3001/generate-milestones', {
        description: `${description} (${amount} USDC)`,
        amount
      });
      setMilestones(response.data);
      toast.success('Milestones generated successfully!');
    } catch (err) {
      toast.error('Failed to generate milestones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!milestones || !freelancerAddress || amount <= 0) {
      toast.error('Please fill all fields and generate milestones');
      return;
    }

    try {
      setLoading(true);
      const milestoneNames = milestones.map(m => m.name);
      const milestoneAmounts = milestones.map(m => parseUnits(m.amount.toString(), 6));

      await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: [
          {
            inputs: [
              { internalType: 'address', name: '_freelancer', type: 'address' },
              { internalType: 'uint256', name: '_totalAmount', type: 'uint256' },
              { internalType: 'string[]', name: '_milestoneNames', type: 'string[]' },
              { internalType: 'uint256[]', name: '_milestoneAmounts', type: 'uint256[]' },
              { internalType: 'string', name: 'projectDescription', type: 'string' }
            ],
            name: 'createInvoice',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function'
          }
        ],
        functionName: 'createInvoice',
        args: [freelancerAddress as `0x${string}`, parseUnits(amount.toString(), 6), milestoneNames, milestoneAmounts, description],
      });
      
      toast.success('Invoice created successfully!');
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

  // Mini App social features
  const handleSaveInvoiceAsFrame = async () => {
    if (!milestones || milestones.length === 0) {
      toast.error('Please generate milestones first');
      return;
    }

    try {
      const result = await addFrame();
      if (result) {
        toast.success('Invoice saved as frame! Share it on Farcaster! 🎉');
      }
    } catch (error) {
      toast.error('Failed to save as frame');
      console.error(error);
    }
  };

  const handleShareInvoice = () => {
    if (!milestones || milestones.length === 0) {
      toast.error('Please generate milestones first');
      return;
    }

    try {
      composeCast({
        text: `Just created an onchain freelance invoice with AI! ${milestones.length} milestones generated. #BuildOnBase #FreelanceAI`,
        embeds: [`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/dashboard'}`],
      });
      toast.success('Shared on Farcaster! 🚀');
    } catch (error) {
      toast.error('Failed to share on Farcaster');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6">
        <ToastContainer />
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🚀 Freelance Invoice AI on Base</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automate your freelance payments with AI-powered milestone generation
          </p>
          {context?.isFrame && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-purple-100 to-purple-800 rounded-full text-sm font-medium text-white">             <span className="mr-2">📱</span>
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
                  <ConnectButton />
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
                    <p className="font-semibold text-green-600">{usdcBalance.formatted} USDC</p>
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
                    value={amount || ''}
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
              
              <div className="flex space-x-4">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !description || amount <= 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? '🤖 Generating...' : '🤖 Generate Milestones'}
                </button>
              </div>
            </div>
            
            {/* Milestones */}
            {milestones && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Milestones</h3>
                <div className="space-y-3">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{milestone.name}</p>
                        <p className="text-sm text-gray-600">{milestone.amount} USDC</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleCreate}
                    disabled={loading || !freelancerAddress}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {loading ? '🚀 Creating Invoice...' : '📄 Create Invoice'}
                  </button>
                  
                  {/* Mini App Social Features */}
                  <div className="flex gap-3">
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
                  </div>
                  <button 
                    onClick={() => openUrl('https://sepolia.basescan.org/address/0xe22Afa829343049B5AD351423b7F74F3')}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    🔍 View on Basescan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 