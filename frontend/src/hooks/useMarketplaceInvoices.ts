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
  // Guard against race conditions: only latest fetch can update state
  const fetchSeqRef = useRef(0);

  // Get the current nonce (total number of invoices created)
  const { data: nonce } = useReadContract({
    address: CONTRACTS.INVOICE_TOKEN as `0x${string}`,
    abi: INVOICE_TOKEN_ABI,
    functionName: 'nonce',
    // Only query when we have a valid contract address
    query: { enabled: Boolean(CONTRACTS.INVOICE_TOKEN) },
  });

  // Watch for new blocks to refresh data
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const fetchInvoices = useCallback(async () => {
    try {
      setError(null);

      // Defer fetching until prerequisites are ready; avoid clearing UI to prevent flicker
      if (!CONTRACTS.INVOICE_TOKEN) {
        console.warn('InvoiceToken contract address is not set (NEXT_PUBLIC_INVOICE_TOKEN_CONTRACT_ADDRESS)');
        setIsLoading(false);
        return;
      }

      if (nonce === undefined || nonce === null || !publicClient) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const seq = ++fetchSeqRef.current;

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

      // Deduplicate by token id to prevent duplicates appearing in UI
      // First, prefer uniqueness by a content signature to avoid visually identical duplicates
      // Signature uses invoiceNumber (if present) + owner + amounts + maturity
      const seen = new Set<string>();
      const bySignature: Invoice[] = [];
      for (const m of merged) {
        const sig = `${m.invoiceNumber || ''}|${m.owner}|${m.loanAmount}|${m.invoiceValue}|${m.maturityDate}`;
        if (!seen.has(sig)) {
          seen.add(sig);
          bySignature.push(m);
        }
      }

      // Then, collapse duplicates that share the same visible invoiceNumber (case/space-insensitive)
      const invoiceNumberMap = new Map<string, Invoice>();
      const withoutInvoiceNumber: Invoice[] = [];
      for (const m of bySignature) {
        if (m.invoiceNumber && m.invoiceNumber.trim()) {
          const key = m.invoiceNumber.trim().toLowerCase();
          const existing = invoiceNumberMap.get(key);
          if (!existing) {
            invoiceNumberMap.set(key, m);
          } else {
            // Prefer the lower id (earlier token) as the canonical entry
            invoiceNumberMap.set(key, m.id < existing.id ? m : existing);
          }
        } else {
          withoutInvoiceNumber.push(m);
        }
      }

      // Finally, ensure uniqueness by id as a safety net
      const combined = [...invoiceNumberMap.values(), ...withoutInvoiceNumber];
      const byId = Array.from(new Map(combined.map((m) => [m.id, m])).values());

      if (seq === fetchSeqRef.current) {
        setInvoices(byId);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      // Only set error if this is the latest fetch
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      // Only flip loading off if this is the latest fetch
      // If a newer fetch started, let that fetch control loading state
      setIsLoading((prev) => {
        return fetchSeqRef.current ? prev : false;
      });
      setIsLoading(false);
    }
  }, [nonce, publicClient]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, blockNumber]);

  const refresh = useCallback(async () => {
    await fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, isLoading, error, refresh };
}
