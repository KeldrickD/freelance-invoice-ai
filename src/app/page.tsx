'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMiniKit, useAddFrame, useOpenUrl, useComposeCast, useAuthenticate } from '@coinbase/onchainkit/minikit';
import { 
  SparklesIcon, 
  CurrencyDollarIcon, 
  ShareIcon, 
  RocketLaunchIcon,
  CpuChipIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

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
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();
  const { composeCast } = useComposeCast();
  const { signIn } = useAuthenticate();
  
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

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
    } catch (error) {
      console.error('Sign-in error:', error);
      toast.error('Failed to sign in');
    }
    setLoading(false);
  };

  const isInMiniApp = !!context; // True if in frame/mini app mode

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <ToastContainer />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <RocketLaunchIcon className="h-16 w-16 text-indigo-600 mr-4" />
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Freelance Invoice AI
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
              Automate your freelance payments with AI-powered milestone generation, onchain escrow, and revenue-generating agents. Built for seamless wallet-native experiences.
            </p>
            {context && (
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-sm font-medium text-white mb-8">
                <span className="mr-2">📱</span>
                Running in Coinbase Wallet Frame
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isConnected ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Wallet Info */}
            <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Connected Address</p>
                  <p className="font-mono text-lg font-semibold text-gray-900">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">USDC Balance</p>
                  <p className="text-lg font-semibold text-green-600">
                    {usdcBalance ? `${parseFloat(formatUnits(usdcBalance.value, 6)).toFixed(2)} USDC` : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Creation Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project (e.g., Build a React dashboard with real-time data visualization)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (USDC)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Freelancer Address
                  </label>
                  <input
                    type="text"
                    value={freelancerAddress}
                    onChange={(e) => setFreelancerAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !description || amount <= 0}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Generating...' : 'Generate AI Milestones'}
                </button>
              </div>

              {/* Generated Milestones */}
              {milestones && milestones.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Generated Milestones</h3>
                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{milestone.name}</span>
                        <span className="text-green-600 font-semibold">{milestone.amount} USDC</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex flex-wrap gap-4">
                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? 'Creating...' : 'Create Onchain Invoice'}
                    </button>
                    
                    <button
                      onClick={handleSaveInvoiceAsFrame}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105"
                    >
                      Save as Frame
                    </button>
                    
                    <button
                      onClick={handleShareInvoice}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                    >
                      Share on Farcaster
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isInMiniApp ? (
          // In mini app: Assume auto-auth; show sign-in if not connected
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Mini App</h2>
                <p className="text-gray-600 mb-8">
                  Sign in to start creating AI-powered freelance invoices
                </p>
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Signing In...' : 'Sign In with Farcaster'}
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  Already authenticated in Coinbase Wallet
                </p>
              </div>
            </div>

            {/* Features Preview */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center mb-4">
                  <CpuChipIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">AI Milestone Generation</h3>
                </div>
                <p className="text-gray-600">
                  Smartly break down projects into payable steps with one click. Our AI analyzes your project description and creates optimal payment milestones.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center mb-4">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Onchain Payments</h3>
                </div>
                <p className="text-gray-600">
                  Escrow USDC, auto-release funds, and earn fees via agents. Secure, transparent, and automated payment flows on Base.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center mb-4">
                  <ShareIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Farcaster Frames</h3>
                </div>
                <p className="text-gray-600">
                  Share invoices socially and save as frames in your wallet. Build your reputation and discover new opportunities.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Standalone: Show connect button
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Connect Wallet Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started</h2>
                <p className="text-gray-600 mb-8">
                  Connect your wallet to start creating AI-powered freelance invoices on Base
                </p>
                <div className="space-y-4">
                  <ConnectButton />
                  <p className="text-sm text-gray-500">
                    Powered by Base & Coinbase for secure, gasless flows
                  </p>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center mb-4">
                  <CpuChipIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">AI Milestone Generation</h3>
                </div>
                <p className="text-gray-600">
                  Smartly break down projects into payable steps with one click. Our AI analyzes your project description and creates optimal payment milestones.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center mb-4">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Onchain Payments</h3>
                </div>
                <p className="text-gray-600">
                  Escrow USDC, auto-release funds, and earn fees via agents. Secure, transparent, and automated payment flows on Base.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center mb-4">
                  <ShareIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Farcaster Frames</h3>
                </div>
                <p className="text-gray-600">
                  Share invoices socially and save as frames in your wallet. Build your reputation and discover new opportunities.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-indigo-400 mr-2" />
            <span className="text-lg font-semibold">Built for Code:NYC Hackathon</span>
          </div>
          <p className="text-gray-400">
            Powered by Base, Coinbase CDP & xAI | Secure • Fast • Decentralized
          </p>
        </div>
      </footer>
    </div>
  );
}