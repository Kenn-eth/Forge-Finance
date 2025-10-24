'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useReadContract, useBlockNumber, usePublicClient } from 'wagmi';
import { CONTRACTS, INVOICE_TOKEN_ABI } from '@/lib/contracts';

export interface Invoice {
  id: number;
  loanAmount: string;
  invoiceValue: string;
  unitValue: string;
  createdAt: string;
  campaignDuration: string;
  campaignEndTime: string;
  maturityDate: string;
  tokenSupply: string;
  availableSupply: string;
  isFulfilled: boolean;
  owner: string;
  invoiceNumber?: string;
  customerName?: string;
  services?: string;
  description?: string;
}

interface ExtractedInvoiceDetails {
  loanAmount: bigint;
  invoiceValue: bigint;
  unitValue: bigint;
  createdAt: bigint;
  createdBy: string;
  campaignDuration: bigint;
  campaignEndTime: bigint;
  maturityDate: bigint;
  tokenSupply: bigint;
  availableSupply: bigint;
  isFulfilled: boolean;
}

function extractInvoiceDetails(u: unknown): ExtractedInvoiceDetails | null {
  if (Array.isArray(u) && u.length >= 11) {
    const a = u as readonly unknown[];
    const [
      loanAmount,
      invoiceValue,
      unitValue,
      createdAt,
      createdBy,
      campaignDuration,
      campaignEndTime,
      maturityDate,
      tokenSupply,
      availableSupply,
      isFulfilled,
    ] = a;
    if (
      typeof loanAmount === 'bigint' &&
      typeof invoiceValue === 'bigint' &&
      typeof unitValue === 'bigint' &&
      typeof createdAt === 'bigint' &&
      typeof createdBy === 'string' &&
      typeof campaignDuration === 'bigint' &&
      typeof campaignEndTime === 'bigint' &&
      typeof maturityDate === 'bigint' &&
      typeof tokenSupply === 'bigint' &&
      typeof availableSupply === 'bigint' &&
      typeof isFulfilled === 'boolean'
    ) {
      return {
        loanAmount,
        invoiceValue,
        unitValue,
        createdAt,
        createdBy,
        campaignDuration,
        campaignEndTime,
        maturityDate,
        tokenSupply,
        availableSupply,
        isFulfilled,
      };
    }
  }
  if (u && typeof u === 'object') {
    const obj = u as Record<string, unknown>;
    const get = <T>(key: string) => obj[key] as T | undefined;
    const loanAmount = get<bigint>('loanAmount');
    const invoiceValue = get<bigint>('invoiceValue');
    const unitValue = get<bigint>('unitValue');
    const createdAt = get<bigint>('createdAt');
    const createdBy = get<string>('createdBy');
    const campaignDuration = get<bigint>('campaignDuration');
    const campaignEndTime = get<bigint>('campaignEndTime');
    const maturityDate = get<bigint>('maturityDate');
    const tokenSupply = get<bigint>('tokenSupply');
    const availableSupply = get<bigint>('availableSupply');
    const isFulfilled = obj['isFulfilled'] as boolean | undefined;
    if (
      loanAmount &&
      invoiceValue &&
      unitValue &&
      createdAt &&
      typeof createdBy === 'string' &&
      campaignDuration &&
      campaignEndTime &&
      maturityDate &&
      tokenSupply &&
      availableSupply &&
      typeof isFulfilled === 'boolean'
    ) {
      return {
        loanAmount,
        invoiceValue,
        unitValue,
        createdAt,
        createdBy,
        campaignDuration,
        campaignEndTime,
        maturityDate,
        tokenSupply,
        availableSupply,
        isFulfilled,
      };
    }
  }
  return null;
}

interface InvoiceApiRow {
  invoice_number?: string;
  customer_name?: string;
  services?: string;
  description?: string;
  token_id?: string | number | null;
  invoice_value?: string | number;
  loan_amount?: string | number;
}

export function useMarketplaceInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();
  const fetchSeqRef = useRef(0);

  // Get the current nonce (total number of invoices created)
  const { data: nonce } = useReadContract({
    address: CONTRACTS.INVOICE_TOKEN as `0x${string}`,
    abi: INVOICE_TOKEN_ABI,
    functionName: 'nonce',
    query: { enabled: Boolean(CONTRACTS.INVOICE_TOKEN) },
  });

  // Remove block watching to prevent excessive refetching and React hooks issues

  const fetchInvoices = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    try {
      setError(null);
      // Only set loading if we don't have invoices yet to prevent flicker
      if (invoices.length === 0) {
        setIsLoading(true);
      }

      // First, fetch from database (fast)
      let dbInvoices: InvoiceApiRow[] = [];
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`);
        if (res.ok) {
          dbInvoices = await res.json();
        }
      } catch (error) {
        console.warn('Failed to fetch from database, falling back to blockchain:', error);
      }

      // If we have database invoices, use them as base and sync with blockchain
      if (dbInvoices.length > 0) {
        const items: Invoice[] = [];
        
        // For each DB invoice with a token_id, fetch blockchain data
        for (const dbInvoice of dbInvoices) {
          if (!dbInvoice.token_id) continue;
          
          try {
            // Fetch blockchain data for this token
            const [detailsResult, ownerResult] = await Promise.all([
              publicClient?.readContract({
                address: CONTRACTS.INVOICE_TOKEN as `0x${string}`,
                abi: INVOICE_TOKEN_ABI,
                functionName: 'idToInvoiceDetails',
                args: [BigInt(dbInvoice.token_id)],
              }),
              publicClient?.readContract({
                address: CONTRACTS.INVOICE_TOKEN as `0x${string}`,
                abi: INVOICE_TOKEN_ABI,
                functionName: 'idToOwner',
                args: [BigInt(dbInvoice.token_id)],
              })
            ]);

            if (detailsResult && ownerResult) {
              const parsed = extractInvoiceDetails(detailsResult);
              if (parsed) {
                items.push({
                  id: Number(dbInvoice.token_id),
                  loanAmount: parsed.loanAmount.toString(),
                  invoiceValue: parsed.invoiceValue.toString(),
                  unitValue: parsed.unitValue.toString(),
                  createdAt: parsed.createdAt.toString(),
                  campaignDuration: parsed.campaignDuration.toString(),
                  campaignEndTime: parsed.campaignEndTime.toString(),
                  maturityDate: parsed.maturityDate.toString(),
                  tokenSupply: parsed.tokenSupply.toString(),
                  availableSupply: parsed.availableSupply.toString(),
                  isFulfilled: parsed.isFulfilled,
                  owner: typeof ownerResult === 'string' ? ownerResult : parsed.createdBy,
                  // Use DB metadata
                  invoiceNumber: dbInvoice.invoice_number,
                  customerName: dbInvoice.customer_name,
                  services: dbInvoice.services,
                  description: dbInvoice.description,
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch blockchain data for token ${dbInvoice.token_id}:`, error);
          }
        }

        // Deduplicate
        const seen = new Set<string>();
        const bySignature: Invoice[] = [];
        for (const m of items) {
          const sig = `${m.invoiceNumber || ''}|${m.owner}|${m.loanAmount}|${m.invoiceValue}|${m.maturityDate}`;
          if (!seen.has(sig)) {
            seen.add(sig);
            bySignature.push(m);
          }
        }

        const invoiceNumberMap = new Map<string, Invoice>();
        const withoutInvoiceNumber: Invoice[] = [];
        for (const m of bySignature) {
          if (m.invoiceNumber && m.invoiceNumber.trim()) {
            const key = m.invoiceNumber.trim().toLowerCase();
            const existing = invoiceNumberMap.get(key);
            if (!existing) {
              invoiceNumberMap.set(key, m);
            } else {
              invoiceNumberMap.set(key, m.id < existing.id ? m : existing);
            }
          } else {
            withoutInvoiceNumber.push(m);
          }
        }

        const combined = [...invoiceNumberMap.values(), ...withoutInvoiceNumber];
        const byId = Array.from(new Map(combined.map((m) => [m.id, m])).values());

        if (seq === fetchSeqRef.current) {
          setInvoices(byId);
        }
        return;
      }

      // Fallback: fetch from blockchain if no database invoices
      if (!CONTRACTS.INVOICE_TOKEN) {
        console.warn('InvoiceToken contract address is not set (NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS)');
        setError('Contract address not configured. Please set NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS.');
        if (seq === fetchSeqRef.current) {
          setIsLoading(false);
        }
        return;
      }

      if (nonce === undefined || nonce === null || !publicClient) {
        if (seq === fetchSeqRef.current) {
          setIsLoading(false);
        }
        return;
      }

      if (Number(nonce) === 0) {
        if (seq === fetchSeqRef.current) {
        setInvoices([]);
        setIsLoading(false);
        }
        return;
      }

      const total = Number(nonce);
      const ids = Array.from({ length: total }, (_, i) => BigInt(i));

      // Multicall to fetch details for all ids
      const detailCalls = ids.map((id) => ({
        address: CONTRACTS.INVOICE_TOKEN as `0x${string}`,
        abi: INVOICE_TOKEN_ABI,
        functionName: 'idToInvoiceDetails',
        args: [id],
      } as const));

      const ownerCalls = ids.map((id) => ({
        address: CONTRACTS.INVOICE_TOKEN as `0x${string}`,
        abi: INVOICE_TOKEN_ABI,
        functionName: 'idToOwner',
        args: [id],
      } as const));

      const [detailResults, ownerResults] = await Promise.all([
        publicClient.multicall({ contracts: detailCalls, allowFailure: true }),
        publicClient.multicall({ contracts: ownerCalls, allowFailure: true }),
      ]);

      const items: Invoice[] = [];
      for (let i = 0; i < ids.length; i++) {
        const idNum = Number(ids[i]);
        const details = detailResults[i];
        const owner = ownerResults[i];

        if (details.status !== 'success' || owner.status !== 'success') continue;

        const parsed = extractInvoiceDetails(details.result);
        if (!parsed) continue;
        const {
          loanAmount,
          invoiceValue,
          unitValue,
          createdAt,
          createdBy,
          campaignDuration,
          campaignEndTime,
          maturityDate,
          tokenSupply,
          availableSupply,
          isFulfilled,
        } = parsed;

        items.push({
          id: idNum,
          loanAmount: loanAmount.toString(),
          invoiceValue: invoiceValue.toString(),
          unitValue: unitValue.toString(),
          createdAt: createdAt.toString(),
          campaignDuration: campaignDuration.toString(),
          campaignEndTime: campaignEndTime.toString(),
          maturityDate: maturityDate.toString(),
          tokenSupply: tokenSupply.toString(),
          availableSupply: availableSupply.toString(),
          isFulfilled,
          owner: typeof owner.result === 'string' ? owner.result : createdBy,
        });
      }

      // Merge DB metadata
      const merged = await Promise.all(items.map(async (inv) => {
        try {
          // First try to get by token_id, if that fails, try to get by the most recent invoice without token_id
          let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/token/${inv.id}`);
          if (!res.ok) {
            // If not found by token_id, try to get the most recent invoice for this business without a token_id
            res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/business/${inv.owner}`);
            if (res.ok) {
              const invoices: InvoiceApiRow[] = await res.json();
              // Find the most recent invoice without a token_id that matches our contract data
              const matchingInvoice = invoices.find((invoice) => 
                !invoice.token_id && 
                Number(invoice.invoice_value) === Number(inv.invoiceValue) &&
                Number(invoice.loan_amount) === Number(inv.loanAmount)
              );
              if (matchingInvoice) {
                return {
                  ...inv,
                  invoiceNumber: matchingInvoice.invoice_number,
                  customerName: matchingInvoice.customer_name,
                  services: matchingInvoice.services,
                  description: matchingInvoice.description,
                } as Invoice;
              }
            }
          } else {
            const row: InvoiceApiRow = await res.json();
            return {
              ...inv,
              invoiceNumber: row.invoice_number,
              customerName: row.customer_name,
              services: row.services,
              description: row.description,
            } as Invoice;
          }
        } catch (error) {
          console.error(`Error fetching metadata for token ${inv.id}:`, error);
        }
        return inv;
      }));

      // Deduplicate
      const seen = new Set<string>();
      const bySignature: Invoice[] = [];
      for (const m of merged) {
        const sig = `${m.invoiceNumber || ''}|${m.owner}|${m.loanAmount}|${m.invoiceValue}|${m.maturityDate}`;
        if (!seen.has(sig)) {
          seen.add(sig);
          bySignature.push(m);
        }
      }

      const invoiceNumberMap = new Map<string, Invoice>();
      const withoutInvoiceNumber: Invoice[] = [];
      for (const m of bySignature) {
        if (m.invoiceNumber && m.invoiceNumber.trim()) {
          const key = m.invoiceNumber.trim().toLowerCase();
          const existing = invoiceNumberMap.get(key);
          if (!existing) {
            invoiceNumberMap.set(key, m);
          } else {
            invoiceNumberMap.set(key, m.id < existing.id ? m : existing);
          }
        } else {
          withoutInvoiceNumber.push(m);
        }
      }

      const combined = [...invoiceNumberMap.values(), ...withoutInvoiceNumber];
      const byId = Array.from(new Map(combined.map((m) => [m.id, m])).values());

      if (seq === fetchSeqRef.current) {
        setInvoices(byId);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      if (seq === fetchSeqRef.current) {
      setIsLoading(false);
      }
    }
  }, [nonce, publicClient, invoices.length]);

  // Initial fetch
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Remove block-based refresh to avoid React hooks rule violations
  // Users can manually refresh using the refresh button

  const refresh = useCallback(async () => {
    await fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, isLoading, error, refresh };
}