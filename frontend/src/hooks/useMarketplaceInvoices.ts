'use client';

import { useState, useEffect, useCallback } from 'react';
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

export function useMarketplaceInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  // Get the current nonce (total number of invoices created)
  const { data: nonce } = useReadContract({
    address: CONTRACTS.INVOICE_TOKEN as `0x${string}`,
    abi: INVOICE_TOKEN_ABI,
    functionName: 'nonce',
  });

  // Watch for new blocks to refresh data
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!nonce || nonce === 0n || !publicClient) {
        setInvoices([]);
        setIsLoading(false);
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

        // details.result is tuple matching InvoiceDetails struct
        const r: any = details.result as any;
        // Depending on ABI generation, tuple may be array-like. Access by index for safety
        const loanAmount = (r.loanAmount ?? r[0]) as bigint;
        const invoiceValue = (r.invoiceValue ?? r[1]) as bigint;
        const unitValue = (r.unitValue ?? r[2]) as bigint;
        const createdAt = (r.createdAt ?? r[3]) as bigint;
        const createdBy = (r.createdBy ?? r[4]) as string;
        const campaignDuration = (r.campaignDuration ?? r[5]) as bigint;
        const campaignEndTime = (r.campaignEndTime ?? r[6]) as bigint;
        const maturityDate = (r.maturityDate ?? r[7]) as bigint;
        const tokenSupply = (r.tokenSupply ?? r[8]) as bigint;
        const availableSupply = (r.availableSupply ?? r[9]) as bigint;
        const isFulfilled = (r.isFulfilled ?? r[10]) as boolean;

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
          owner: (owner.result as string) || createdBy,
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
              const invoices = await res.json();
              // Find the most recent invoice without a token_id that matches our contract data
              const matchingInvoice = invoices.find((invoice: any) => 
                !invoice.token_id && 
                parseInt(invoice.invoice_value) === parseInt(inv.invoiceValue) &&
                parseInt(invoice.loan_amount) === parseInt(inv.loanAmount)
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
            const row = await res.json();
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

      setInvoices(merged);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
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
