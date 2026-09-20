export interface Currency {
  name: string;
  code: string;
  symbol: string;
  decimalDigits: number;
}

export interface Trip {
  id: string;
  name: string;
  description: string;
  currency: Currency;
  createdAt: number;
}
