// IPFS utility functions for document storage
// In a real implementation, you would use a service like Pinata, Infura, or your own IPFS node

export interface DocumentMetadata {
  name: string;
  description: string;
  fileType: string;
  size: number;
  uploadedAt: string;
}

export interface InvoiceMetadata {
  name: string;
  description: string;
  image?: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: Record<string, any>;
}

export async function uploadToIPFS(file: File): Promise<string> {
  // Mock implementation - replace with actual IPFS upload
  console.log('Uploading file to IPFS:', file.name);
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock hash
  return `QmMockHash${Date.now()}`;
}

export async function uploadDocumentMetadata(metadata: DocumentMetadata): Promise<string> {
  // Mock implementation - replace with actual IPFS upload
  console.log('Uploading metadata to IPFS:', metadata);
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock hash
  return `QmMetadataHash${Date.now()}`;
}

export function generateDocumentHash(files: string[], metadata: string): string {
  // Mock implementation - in reality, you would hash the actual content
  const combined = [...files, metadata].join('');
  return `0x${Buffer.from(combined).toString('hex').slice(0, 64)}`;
}

// New function to create invoice in database and return URI
export async function createInvoiceInDatabase(invoiceData: any): Promise<string> {
  try {
    const response = await fetch('http://localhost:3001/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.metadata_uri;
  } catch (error) {
    console.error('Error creating invoice in database:', error);
    throw error;
  }
}

// Function to get invoice metadata from database
export async function getInvoiceMetadata(metadataUri: string): Promise<InvoiceMetadata> {
  try {
    const response = await fetch(metadataUri);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching invoice metadata:', error);
    throw error;
  }
}

// Helper function to create invoice metadata from form data
export function createInvoiceMetadata(formData: any, businessAddress: string): InvoiceMetadata {
  return {
    name: `Invoice #${formData.invoiceNumber}`,
    description: formData.description || `Invoice for ${formData.services}`,
    image: "https://via.placeholder.com/400x300?text=Invoice+Document",
    external_url: `https://yourplatform.com/invoice/${formData.invoiceNumber}`,
    attributes: [
      { trait_type: "Invoice Number", value: formData.invoiceNumber },
      { trait_type: "Customer Name", value: formData.customerName },
      { trait_type: "Customer Email", value: formData.customerEmail },
      { trait_type: "Services", value: formData.services },
      { trait_type: "Invoice Value", value: `${formData.invoiceValue} USD` },
      { trait_type: "Loan Amount", value: `${formData.loanAmount} USD` },
      { trait_type: "Due Date", value: formData.dueDate },
      { trait_type: "Created At", value: new Date().toISOString() },
      { trait_type: "Business Address", value: businessAddress }
    ],
    properties: {
      invoiceNumber: formData.invoiceNumber,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      services: formData.services,
      invoiceValue: formData.invoiceValue,
      loanAmount: formData.loanAmount,
      dueDate: formData.dueDate,
      description: formData.description
    }
  };
}
