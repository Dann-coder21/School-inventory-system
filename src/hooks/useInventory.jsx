// hooks/useInventory.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const fetchInventory = async () => {
  const token = localStorage.getItem('token');
  const { data } = await axios.get('http://localhost:3000/items/inventory', {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 5000
  });
  return data;
};

const addItem = async (newItem) => {
  const token = localStorage.getItem('token');
  const { data } = await axios.post(
    'http://localhost:3000/items/inventory',
    newItem,
    { 
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    }
  );
  return data.item;
};

const withdrawItem = async ({ itemId, quantity, recipientName }) => {
  const token = localStorage.getItem('token');
  const { data } = await axios.post(
    'http://localhost:3000/withdraw/withdrawal',
    {
      item_id: itemId,
      quantity_withdrawn: quantity,
      recipient_name: recipientName
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 50000
    }
  );
  return data;
};

export const useInventory = () => {
  const queryClient = useQueryClient();

  const { 
    data: items = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
    initialData: () => {
      const cached = localStorage.getItem('inventoryData');
      return cached ? JSON.parse(cached).data : undefined;
    }
  });

  const addMutation = useMutation({
    mutationFn: addItem,
    onSuccess: (newItem) => {
      // Optimistic update
      queryClient.setQueryData(['inventory'], (old) => [...old, newItem]);
      // Update localStorage
      localStorage.setItem('inventoryData', JSON.stringify({
        data: [...items, newItem],
        lastUpdated: new Date().toISOString()
      }));
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: withdrawItem,
    onSuccess: (_, variables) => {
      // Optimistic update
      queryClient.setQueryData(['inventory'], (old) => 
        old.map(item => 
          item.id === variables.itemId 
            ? { 
                ...item, 
                quantity: item.quantity - variables.quantity,
                status: item.quantity - variables.quantity <= 0 ? 'Out of Stock' : 
                        item.quantity - variables.quantity < 5 ? 'Low Stock' : 'Available'
              }
            : item
        )
      );
      // Update localStorage
      const updated = items.map(item => 
        item.id === variables.itemId 
          ? { ...item, quantity: item.quantity - variables.quantity }
          : item
      );
      localStorage.setItem('inventoryData', JSON.stringify({
        data: updated,
        lastUpdated: new Date().toISOString()
      }));
    }
  });

  return {
    items,
    isLoading,
    error,
    refetch,
    addItem: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    withdrawItem: withdrawMutation.mutateAsync,
    isWithdrawing: withdrawMutation.isPending
  };
};