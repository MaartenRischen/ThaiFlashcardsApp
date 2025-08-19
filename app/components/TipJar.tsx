'use client';

import React, { useMemo, useState } from 'react';
import { Copy, Check, Wallet, CreditCard } from 'lucide-react';

type Network = 'Bitcoin' | 'Ethereum' | 'Solana' | 'Lightning' | 'USDC' | 'Monero';
type Chain = 'Ethereum' | 'Polygon' | 'BSC' | 'Solana';

interface AddressEntry {
  label: Network;
  address: string;
  uri?: string; // payment URI when applicable
  chain?: Chain; // For tokens like USDC that exist on multiple chains
  qrData?: string; // QR code data (can be address or URI)
}

interface CryptoAddress {
  address: string;
  chain?: Chain;
  uri?: string;
}

interface TipJarProps {
  // Crypto addresses (set via env or settings)
  addresses?: Partial<Record<Network, CryptoAddress>>;
  // Traditional payment URLs
  paypalUrl?: string;
  stripeUrl?: string;
  kofiUrl?: string;
  buyMeACoffeeUrl?: string;
  patreonUrl?: string;
  // Display options
  showQrCodes?: boolean;
  preferredChains?: Chain[]; // For multi-chain tokens like USDC
}

export default function TipJar({ addresses, paypalUrl, stripeUrl }: TipJarProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const entries: AddressEntry[] = useMemo(() => {
    const list: AddressEntry[] = [];
    if (addresses?.Bitcoin) list.push({ label: 'Bitcoin', address: addresses.Bitcoin, uri: `bitcoin:${addresses.Bitcoin}` });
    if (addresses?.Lightning) list.push({ label: 'Lightning', address: addresses.Lightning, uri: `lightning:${addresses.Lightning}` });
    if (addresses?.Ethereum) list.push({ label: 'Ethereum', address: addresses.Ethereum, uri: `ethereum:${addresses.Ethereum}` });
    if (addresses?.Solana) list.push({ label: 'Solana', address: addresses.Solana, uri: `solana:${addresses.Solana}` });
    return list;
  }, [addresses]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  };

  return (
    <div className="w-full max-w-xl mx-auto border border-[#333] rounded-lg bg-[#121212] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Tip Jar</h3>
      </div>

      {entries.length === 0 && !paypalUrl && !stripeUrl && (
        <p className="text-sm text-gray-400">No payment methods configured yet.</p>
      )}

      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.label} className="bg-[#1a1a1a] rounded-md p-3 border border-[#2a2a2a]">
            <div className="text-sm text-gray-300 mb-1">{e.label}</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-gray-400 break-all">{e.address}</code>
              <button
                className="neumorphic-button text-blue-400 px-2 py-1 text-xs"
                onClick={() => handleCopy(e.address, e.label)}
                title="Copy address"
              >
                {copied === e.label ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              {e.uri && (
                <a
                  className="neumorphic-button text-green-400 px-2 py-1 text-xs"
                  href={e.uri}
                  target="_blank"
                  rel="noreferrer noopener"
                  title="Open in wallet"
                >
                  Open
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {(paypalUrl || stripeUrl) && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {paypalUrl && (
            <a href={paypalUrl} target="_blank" rel="noreferrer noopener" className="neumorphic-button text-blue-300 flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" /> PayPal
            </a>
          )}
          {stripeUrl && (
            <a href={stripeUrl} target="_blank" rel="noreferrer noopener" className="neumorphic-button text-purple-300 flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" /> Card
            </a>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3">Thanks for supporting development! 🙏</p>
    </div>
  );
}


