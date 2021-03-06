import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stockProduct } = await api.get(`/stock/${productId}`);

      let product = cart.find((item) => item.id === productId);

      let updatedCart = cart;

      if (product) {
        if (product.amount >= stockProduct.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        updatedCart = cart.map((item) => {
          if (item.id === productId) {
            item.amount += 1;
          }
          return item;
        });
      } else {
        const response = await api.get(`/products/${productId}`);
        product = response.data as Product;
        product.amount = 1;

        updatedCart = [...cart, product];
      }

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (!cart.find((item) => item.id === productId)) {
        throw Error();
      }

      const updatedCart = cart.filter((item) => item.id !== productId);

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const { data: stockProduct } = await api.get(`/stock/${productId}`);

      if (amount > stockProduct.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } else if (!cart.find((item) => item.id === productId)) {
        throw Error();
      }

      const updatedCart = cart.map((item) => {
        if (item.id === productId) {
          item.amount = amount;
        }
        return item;
      });

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
