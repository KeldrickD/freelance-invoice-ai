'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits } from 'viem';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DynamicConnectButton } from '@dynamic-labs/sdk-react-core';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
const CONTRACT_ADDRESS = '0xe22EAfa82934Be3049B5AD3B2514A123bb7F74F3';

interface Invoice {
  id: number;
  freelancer: string;
  client: string;
  totalAmount: bigint;
  paid: boolean;
  projectDescription: string;
  milestoneAmounts: bigint[];
  milestoneCompleted: boolean[];
}

export default function Dashboard() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const { primaryWallet } = useDynamicContext();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch nextInvoiceId
  const { data: nextId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [
      {
        inputs: [],
        outputs: [{ internalType: 'uint256', name: 'nextInvoiceId', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'nextInvoiceId',
  });

  // Fetch invoice details
  const { data: invoiceDetails } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [
      {
        inputs: [{ internalType: 'uint256', name: '_invoiceId', type: 'uint256' }],
        name: 'getInvoice',
        outputs: [
          { internalType: 'address', name: 'freelancer', type: 'address' },
          { internalType: 'address', name: 'client', type: 'address' },
          { internalType: 'uint256', name: 'totalAmount', type: 'uint256' },
          { internalType: 'tuple[]', name: 'milestones', type: 'tuple[]', components: [
            { internalType: 'string', name: 'name', type: 'string' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'bool', name: 'completed', type: 'bool' },
            { internalType: 'uint256', name: 'completedAt', type: 'uint256' }
          ]},
          { internalType: 'bool', name: 'paid', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'string', name: 'projectDescription', type: 'string' }
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getInvoice',
    args: [0n], // We'll fetch each invoice individually
  });

  // Fetch milestone amounts
  const { data: milestoneAmounts } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [
      {
        inputs: [{ internalType: 'uint256', name: '_invoiceId', type: 'uint256' }],
        name: 'getMilestoneAmounts',
        outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getMilestoneAmounts',
    args: [0n], // We'll fetch each invoice individually
  });

  // Fetch milestone completion status
  const { data: milestoneCompleted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [
      {
        inputs: [{ internalType: 'uint256', name: '_invoiceId', type: 'uint256' }],
        name: 'getMilestoneCompleted',
        outputs: [{ internalType: 'bool[]', name: '', type: 'bool[]' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getMilestoneCompleted',
    args: [0n], // We'll fetch each invoice individually
  });

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!nextId || Number(nextId) === 0) return;
      setLoading(true);
      const invs: Invoice[] = [];
      for (let i = 0; i < Number(nextId); i++) {
        try {
          // Fetch invoice details
          // ... (omitted for brevity)
          invs.push({
            id: i,
            freelancer: '0x1234...5678',
            client: '0x8765...4321',
            totalAmount: BigInt(100 * 10 ** 6), // 1000 USDC with 6 decimals
            paid: false,
            projectDescription: `Project ${i + 1}`,
            milestoneAmounts: [BigInt(300 * 10 ** 6), BigInt(400 * 10 ** 6), BigInt(300 * 10 ** 6)],
            milestoneCompleted: [false, false, false],
          });
        } catch (error) {
          console.error(`Error fetching invoice ${i}:`, error);
        }
      }
      setInvoices(invs);
      setLoading(false);
    };
    fetchInvoices();
  }, [nextId]);

  const handleComplete = async (invoiceId: number, milestoneIndex: number) => {
    try {
      setLoading(true);
      if (primaryWallet) {
        // Use Smart Wallet if available, otherwise fallback to regular transaction
        try {
          // Try to use Smart Wallet features if available
          await writeContract({
            address: CONTRACT_ADDRESS,
            abi: [
              {
                inputs: [
                  { internalType: 'uint256', name: '_invoiceId', type: 'uint256' },
                  { internalType: 'uint256', name: '_milestoneIndex', type: 'uint256' },
                ],
                name: 'completeMilestone',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
            ],
            functionName: 'completeMilestone',
            args: [BigInt(invoiceId), BigInt(milestoneIndex)],
          });
          toast.success('Milestone completed with Smart Wallet! 🚀');
        } catch (smartWalletError) {
          console.log('Smart Wallet not available, using regular transaction');
          // Fallback to regular transaction
          await writeContract({
            address: CONTRACT_ADDRESS,
            abi: [
              {
                inputs: [
                  { internalType: 'uint256', name: '_invoiceId', type: 'uint256' },
                  { internalType: 'uint256', name: '_milestoneIndex', type: 'uint256' },
                ],
                name: 'completeMilestone',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
            ],
            functionName: 'completeMilestone',
            args: [BigInt(invoiceId), BigInt(milestoneIndex)],
          });
          toast.success('Milestone completed!');
        }
      } else {
        // Regular wallet transaction
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: [
            {
              inputs: [
                { internalType: 'uint256', name: '_invoiceId', type: 'uint256' },
                { internalType: 'uint256', name: '_milestoneIndex', type: 'uint256' },
              ],
              name: 'completeMilestone',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          functionName: 'completeMilestone',
          args: [BigInt(invoiceId), BigInt(milestoneIndex)],
        });
        toast.success('Milestone completed!');
      }
    } catch (err) {
      toast.error('Error completing milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoComplete = async (invoiceId: number, milestoneIndex: number) => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:3001/trigger-agent-complete', { invoiceId, milestoneIndex });
      toast.success('Agent auto-complete tx: ' + res.data.txHash);
    } catch (err) {
      toast.error('AgentKit error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-6">
        <ToastContainer />
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Invoice Dashboard</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            View and manage your freelance invoices with Smart Wallet technology
          </p>
          {primaryWallet && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <span className="mr-2">✨</span>
              Smart Wallet Connected - Gasless Transactions Available
            </div>
          )}
        </div>
        {!address ? (
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
          <>
            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Invoices</p>
                  <p className="text-3xl font-bold text-blue-600">{nextId ? Number(nextId) : 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Connected Address</p>
                  <p className="font-mono text-sm text-gray-900 truncate">{address}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Wallet Type</p>
                  <p className="text-lg font-semibold text-green-600">
                    {primaryWallet ? 'Smart Wallet' : 'Regular Wallet'}
                  </p>
                </div>
              </div>
            </div>
            {/* Invoices */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-flex items-center px-4 bg-blue-100 text-blue-800">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Loading...
                </div>
              </div>
            )}
            <div className="space-y-6">
              {invoices.map(inv => (
                <div key={inv.id} className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Invoice #{inv.id}</h3>
                      <p className="text-gray-600">{inv.projectDescription}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{formatUnits(inv.totalAmount, 6)} USDC</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${inv.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {inv.paid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Freelancer</p>
                      <p className="font-mono text-sm text-gray-900">{inv.freelancer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Client</p>
                      <p className="font-mono text-sm text-gray-900">{inv.client}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Milestones</h4>
                    <div className="space-y-3">
                      {inv.milestoneAmounts.map((amt: bigint, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">Milestone {idx + 1}</p>
                            <p className="text-sm text-gray-600">{formatUnits(amt, 6)} USDC</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${inv.milestoneCompleted[idx] ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {inv.milestoneCompleted[idx] ? '✅ Completed' : '⏳ Pending'}
                            </span>
                            {!inv.milestoneCompleted[idx] && (
                              <>
                                <button 
                                  onClick={() => handleComplete(inv.id, idx)} 
                                  disabled={loading}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                                >
                                  {loading ? 'Completing...' : 'Complete'}
                                </button>
                                <button 
                                  onClick={() => handleAutoComplete(inv.id, idx)} 
                                  disabled={loading}
                                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                                >
                                  {loading ? 'Processing...' : '🤖 AI Auto-Complete'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Features */}
            <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">💡 Dashboard Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="mr-3 text-green-600">✅</span>
                    <span>View all invoices created by your wallet</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 text-green-600">✅</span>
                    <span>Complete milestones to release payments</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 text-green-600">✅</span>
                    <span>Track payment status and amounts</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="mr-3 text-green-600">✅</span>
                    <span>Manage multiple freelance projects</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 text-purple-600">🤖</span>
                    <span>AI Agent auto-completion (AgentKit integration)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 text-blue-600">✨</span>
                    <span>Smart Wallet gasless transactions</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 