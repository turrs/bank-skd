declare global {
  interface Window {
    snap: {
      pay: (
        params: {
          transaction_details: {
            order_id: string;
            gross_amount: number;
          };
          item_details: Array<{
            id: string;
            price: number;
            quantity: number;
            name: string;
          }>;
          customer_details: {
            first_name: string;
            email: string;
            phone: string;
          };
        },
        callbacks: {
          onSuccess: (result: any) => void;
          onPending: (result: any) => void;
          onError: (result: any) => void;
          onClose: () => void;
        }
      ) => void;
    };
  }
}

export {};
