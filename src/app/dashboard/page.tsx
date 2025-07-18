'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { normalize } from 'viem/ens';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const CONTRACT_ADDRESS = '0xe22Afa829343049B5AD351423b7F74F3';
const USDC_ADDRESS = '0x036D53842c54266347929541318dCF7';

const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTE2IDhDMTguMjA5MSA4IDIwIDkuNzkwODYgMjAgMTJDMjAgMTQuMjA5MSAxOC4yMDkxIDE2IDE2IDE2QzEzLjc5MDkgMTYgMTIgMTQuMjA5MSAxMiAxMkMxMiA5Ljc5MDg2IDEzLjc5MDkgOCAxNiA4WiIgZmlsbD0iIzY4NzM4MCIvPgo8cGF0aCBkPSJNOCAyNEM4IDIwLjY4NjMgMTAuNjg2MyAxOCAxNCAxOEgxOEMyMS4zMTM3IDE4IDI0IDIwLjY4NjMgMjQgMjRWMjZIMFYyNFoiIGZpbGw9IiM2ODczODAiLz4KPC9zdmc+';

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

interface ResolvedInvoice extends Invoice {
  freelancerName?: string | null;
  clientName?: string | null;
  freelancerAvatar?: string | null;
  clientAvatar?: string | null;
}

export default function Dashboard() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const publicClient = usePublicClient();
  const [invoices, setInvoices] = useState<ResolvedInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextId, setNextId] = useState<bigint>(0n);

  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS as `0x${string}`,
  });

  const resolveEnsDetails = async (addr: string) => {
    if (!publicClient || !addr) return { name: null, avatar: null };
    try {
      const name = await publicClient.getEnsName({ 
        address: addr as `0x${string}`,
        universalResolverAddress: '0xC049A6cAF0663a8DA85f8c4572Ad61f4f0f26bEb' // Base's resolver
      });
      let avatar = null;
      if (name) {
        avatar = await publicClient.getEnsAvatar({ 
          name: normalize(name),
          universalResolverAddress: '0xC049A6cAF0663a8DA85f8c4572Ad61f4f0f26bEb', // Same resolver
          assetGatewayUrls: { ipfs: 'https://cloudflare-ipfs.com' } // Optional: For IPFS avatars
        });
      }
      return { name, avatar };
    } catch (error) {
      console.error('ENS resolution error:', error);
      return { name: null, avatar: null };
    }
  };

  const fetchInvoices = async () => {
    if (!nextId || !address) return;
    const invs: ResolvedInvoice[] = [];
    
    for (let i = 0; i < Number(nextId); i++) {
      try {
        const invoice = await publicClient?.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: [
            {
              inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
              name: 'invoices',
              outputs: [
                { internalType: 'address', name: 'freelancer', type: 'address' },
                { internalType: 'address', name: 'client', type: 'address' },
                { internalType: 'uint256', name: 'totalAmount', type: 'uint256' },
                { internalType: 'bool', name: 'paid', type: 'bool' },
                { internalType: 'string', name: 'projectDescription', type: 'string' },
                { internalType: 'uint256[]', name: 'milestoneAmounts', type: 'uint256[]' },
                { internalType: 'bool[]', name: 'milestoneCompleted', type: 'bool[]' }
              ],
              stateMutability: 'view',
              type: 'function'
            }
          ],
          functionName: 'invoices',
          args: [BigInt(i)]
        });

        if (invoice) {
          const [freelancer, client, totalAmount, paid, projectDescription, milestoneAmounts, milestoneCompleted] = invoice;
          
          if (freelancer !== '0x0000000000000000000000000000000000000000') {
            const [freelancerDetails, clientDetails] = await Promise.all([
              resolveEnsDetails(freelancer),
              resolveEnsDetails(client)
            ]);

            invs.push({
              id: i,
              freelancer,
              client,
              totalAmount,
              paid,
              projectDescription,
              milestoneAmounts: [...milestoneAmounts],
              milestoneCompleted: [...milestoneCompleted],
              freelancerName: freelancerDetails.name,
              freelancerAvatar: freelancerDetails.avatar,
              clientName: clientDetails.name,
              clientAvatar: clientDetails.avatar
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching invoice ${i}:`, error);
      }
    }
    
    setInvoices(invs);
  };

  const fetchNextId = async () => {
    if (!address) return;
    try {
      const nextIdResult = await publicClient?.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: [
          {
            inputs: [],
            name: 'nextId',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
          }
        ],
        functionName: 'nextId'
      });
      setNextId(nextIdResult || 0n);
    } catch (error) {
      console.error('Error fetching nextId:', error);
    }
  };

  useEffect(() => {
    fetchNextId();
  }, [address]);

  useEffect(() => {
    if (nextId > 0n) {
      fetchInvoices();
    }
  }, [nextId, address]);

  const handlePayInvoice = async (invoiceId: number) => {
    try {
      setLoading(true);
      await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: [
          {
            inputs: [{ internalType: 'uint256', name: '_invoiceId', type: 'uint256' }],
            name: 'payInvoice',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function'
          }
        ],
        functionName: 'payInvoice',
        args: [BigInt(invoiceId)]
      });
      toast.success('Payment successful!');
      fetchInvoices(); // Refresh the list
    } catch (error) {
      toast.error('Payment failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMilestone = async (invoiceId: number, milestoneIndex: number) => {
    try {
      setLoading(true);
      await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: [
          {
            inputs: [
              { internalType: 'uint256', name: '_invoiceId', type: 'uint256' },
              { internalType: 'uint256', name: '_milestoneIndex', type: 'uint256' }
            ],
            name: 'completeMilestone',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function'
          }
        ],
        functionName: 'completeMilestone',
        args: [BigInt(invoiceId), BigInt(milestoneIndex)]
      });
      toast.success('Milestone completed!');
      fetchInvoices(); // Refresh the list
    } catch (error) {
      toast.error('Failed to complete milestone');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Connect Your Wallet</h2>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <ToastContainer />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your freelance invoices and payments</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Connected</p>
              <p className="font-mono text-sm text-gray-700">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              {usdcBalance && (
                <p className="text-sm text-green-600 mt-1">
                  {parseFloat(formatUnits(usdcBalance.value, 6)).toFixed(2)} USDC
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="space-y-6">
          {invoices.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <p className="text-gray-500">No invoices found. Create your first invoice!</p>
            </div>
          ) : (
            invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Invoice #{invoice.id}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{invoice.projectDescription}</p>
                    
                    {/* Participants with Avatars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Freelancer:</p>
                        <div className="flex items-center gap-2">
                          <img 
                            src={invoice.freelancerAvatar || DEFAULT_AVATAR} 
                            alt="Freelancer Avatar" 
                            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200" 
                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                          />
                          <span className="font-medium text-gray-900">
                            {invoice.freelancerName || `${invoice.freelancer.slice(0, 6)}...${invoice.freelancer.slice(-4)}`}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Client:</p>
                        <div className="flex items-center gap-2">
                          <img 
                            src={invoice.clientAvatar || DEFAULT_AVATAR} 
                            alt="Client Avatar" 
                            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200" 
                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                          />
                          <span className="font-medium text-gray-900">
                            {invoice.clientName || `${invoice.client.slice(0, 6)}...${invoice.client.slice(-4)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {parseFloat(formatUnits(invoice.totalAmount, 6)).toFixed(2)} USDC
                    </p>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                      invoice.paid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.paid ? 'Paid' : 'Pending'}
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Milestones</h4>
                  <div className="space-y-2">
                    {invoice.milestoneAmounts.map((amount, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">
                            Milestone {index + 1}
                          </span>
                          <span className="text-sm text-green-600 font-semibold">
                            {parseFloat(formatUnits(amount, 6)).toFixed(2)} USDC
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.milestoneCompleted[index]
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {invoice.milestoneCompleted[index] ? 'Completed' : 'Pending'}
                          </div>
                          {!invoice.milestoneCompleted[index] && (
                            <button
                              onClick={() => handleCompleteMilestone(invoice.id, index)}
                              disabled={loading}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {!invoice.paid && (
                    <button
                      onClick={() => handlePayInvoice(invoice.id)}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Pay Invoice'}
                    </button>
                  )}
                  <a
                    href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 text-center"
                  >
                    View on Basescan
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 