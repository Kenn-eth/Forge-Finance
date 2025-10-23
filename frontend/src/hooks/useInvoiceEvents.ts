'use client';

// import { useEffect } from 'react';
import { useWatchContractEvent } from 'wagmi';
import { CONTRACTS, INVOICE_TOKEN_ABI } from '@/lib/contracts';
import { decodeEventLog } from 'viem';

interface InvoiceMintedEvent {
  createdBy: string;
  id: bigint;
  amount: bigint;
  metadataURI: string;
}

export function useInvoiceEvents(onInvoiceCreated?: (event: InvoiceMintedEvent) => void) {
  // Listen for InvoiceMinted events
  useWatchContractEvent({
    address: CONTRACTS.INVOICE_TOKEN,
    abi: INVOICE_TOKEN_ABI,
    eventName: 'InvoiceMinted',
    onLogs(logs) {
      console.log('InvoiceMinted event detected:', logs);
      
      // Process each event
      logs.forEach((log) => {
        try {
          const decoded = decodeEventLog({
            abi: INVOICE_TOKEN_ABI as any,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'InvoiceMinted') {
            const args = decoded.args as {
              createdBy: string;
              id: bigint;
              amount: bigint;
              metadataURI: string;
            };

            const event: InvoiceMintedEvent = {
              createdBy: args.createdBy,
              id: args.id,
              amount: args.amount,
              metadataURI: args.metadataURI,
            };
            
            console.log('New invoice created:', event);
            
            // Call the callback if provided
            if (onInvoiceCreated) {
              onInvoiceCreated(event);
            }
          }
        } catch (e) {
          // ignore non-matching logs
        }
      });
    },
  });
}
