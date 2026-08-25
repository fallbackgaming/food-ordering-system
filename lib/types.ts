export type StationType = "pc" | "ps";

export type PaymentMethod = "cash" | "upi" | "bank";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  emoji: string;
  isAvailable: boolean;
};

export type CartLine = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  emoji: string;
  quantity: number;
};
