'use client';

// import { useEffect } from 'react';
import { useWatchContractEvent } from 'wagmi';
import { CONTRACTS, INVOICE_TOKEN_ABI } from '@/lib/contracts';

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
        if (log.args) {
          const event: InvoiceMintedEvent = {
            createdBy: log.args.createdBy,
            id: log.args.id,
            amount: log.args.amount,
            metadataURI: log.args.metadataURI,
          };
          
          console.log('New invoice created:', event);
          
          // Call the callback if provided
          if (onInvoiceCreated) {
            onInvoiceCreated(event);
          }
        }
      });
    },
  });
}
