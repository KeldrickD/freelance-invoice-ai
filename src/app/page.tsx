'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits, isAddress } from 'viem';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useMiniKit, useAddFrame, useComposeCast, useAuthenticate } from '@coinbase/onchainkit/minikit';
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
  const publicClient = usePublicClient();
  
  // MiniKit hooks for Coinbase Mini App features
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const addFrame = useAddFrame();
  const { composeCast } = useComposeCast();
  const { signIn } = useAuthenticate();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [freelancerAddress, setFreelancerAddress] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>();
  const [loading, setLoading] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

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

  const resolveFreelancerAddress = async (input: string) => {
    if (!publicClient) {
      toast.error('Wallet client not available');
      return null;
    }
    
    if (isAddress(input)) {
      return input; // Already a valid 0x address
    } else if (input.endsWith('.eth')) {
      try {
        setResolvingAddress(true);
        const resolved = await publicClient.getEnsAddress({ 
          name: input.toLowerCase(),
          universalResolverAddress: '0xC049A6cAF0663a8DA85f8c4572Ad61f4f0f26bEb' // Base's universal resolver
        });
        if (resolved) {
          toast.success(`Resolved ${input} to ${resolved.slice(0, 6)}...${resolved.slice(-4)}`);
          return resolved;
        } else {
          throw new Error('Name not resolved');
        }
      } catch (error) {
        toast.error(`Invalid ENS name—could not resolve ${input}. Try a .base.eth or mainnet .eth.`);
        return null;
      } finally {
        setResolvingAddress(false);
      }
    } else {
      toast.error('Enter a valid 0x address or ENS name (.eth).');
      return null;
    }
  };

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
      
      // Resolve freelancer address if it's an ENS name
      const resolvedAddress = await resolveFreelancerAddress(freelancerAddress);
      if (!resolvedAddress) {
        setLoading(false);
        return; // Error already shown by resolveFreelancerAddress
      }

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
        args: [resolvedAddress as `0x${string}`, parseUnits(amount.toString(), 6), milestoneNames, milestoneAmounts, description],
        // Base Pay gas sponsorship
        gas: 500000n, // Estimated gas limit
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-6">
      <ToastContainer />
      
      {/* Hero Section */}
      <header className="text-center mt-8 mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <RocketLaunchIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-4xl font-bold text-indigo-800">
            Freelance Invoice AI
          </h1>
        </div>
        <p className="text-lg text-gray-600 mb-2">
          AI milestones, onchain payments & frames on Base.
        </p>
        {context && (
          <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-medium text-white mt-2">
            <span className="mr-1">📱</span>
            Mini App Mode
          </div>
        )}
        <p className="text-sm text-gray-500 mt-2">
          Built on Base with Coinbase CDP tools
        </p>
      </header>

      {/* Core Action Area */}
      <section className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        {isConnected || isInMiniApp ? (
          <div>
            {/* Wallet Info - Subtle */}
            {address && (
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500">Connected</p>
                <p className="font-mono text-sm text-gray-700">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                {usdcBalance && (
                  <p className="text-xs text-green-600 mt-1">
                    {parseFloat(formatUnits(usdcBalance.value, 6)).toFixed(2)} USDC
                  </p>
                )}
              </div>
            )}

            {/* AI Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project (e.g., Build a React dashboard with real-time data visualization)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount (USDC)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Freelancer Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={freelancerAddress}
                      onChange={(e) => setFreelancerAddress(e.target.value)}
                      placeholder="0x... or ENS name like user.eth"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-8"
                    />
                    {resolvingAddress && (
                      <div className="absolute right-2 top-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports .eth and .base.eth names
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !description || amount <= 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Generating...' : 'Generate AI Milestones'}
              </button>

              {/* Generated Milestones */}
              {milestones && milestones.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Generated Milestones</h3>
                  <div className="space-y-2 mb-4">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900 text-sm">{milestone.name}</span>
                        <span className="text-green-600 font-semibold text-sm">{milestone.amount} USDC</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? 'Creating...' : 'Create Onchain Invoice'}
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveInvoiceAsFrame}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 px-3 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105 text-sm"
                      >
                        Save as Frame
                      </button>
                      
                      <button
                        onClick={handleShareInvoice}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 text-sm"
                      >
                        Share on Farcaster
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Not connected - show sign-in button
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to Create AI Invoices?</h2>
            <p className="text-gray-600 mb-6 text-sm">
              Sign in to start generating milestones and creating onchain invoices
            </p>
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Signing In...' : 'Sign In to Start'}
            </button>
          </div>
        )}
      </section>

      {/* Features Teaser - Only show if not in mini app mode or if connected */}
      {(!isInMiniApp || isConnected) && (
        <section className="mt-8 grid grid-cols-1 gap-4 max-w-lg w-full">
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
            <div className="flex items-center gap-3">
              <CpuChipIcon className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">AI Milestones</h3>
                <p className="text-gray-600 text-xs">Instant project breakdown with smart milestone generation.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Onchain Escrow</h3>
                <p className="text-gray-600 text-xs">Secure USDC payments with automated milestone releases.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
            <div className="flex items-center gap-3">
              <ShareIcon className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Frames & Sharing</h3>
                <p className="text-gray-600 text-xs">Save as frames and share on Farcaster for viral growth.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
            <div className="flex items-center gap-3">
              <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Base Pay Integration</h3>
                <p className="text-gray-600 text-xs">ENS name resolution & gas sponsorship for seamless UX.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer - Slim and contextual */}
      <footer className="mt-auto py-4 text-center text-sm text-gray-500">
        <p>Built for Code:NYC Hackathon | Powered by Base, Coinbase CDP & xAI</p>
        {isConnected && (
          <a 
            href="/dashboard" 
            className="inline-block mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View My Invoices →
          </a>
        )}
      </footer>
    </div>
  );
}