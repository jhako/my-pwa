import Dexie, { Table } from "dexie";

export interface StockHolding {
  code: string;
  type: string;
  amount: number;
  acq_price: number;
  acq_rate: number;
  start: number;
  end: number;
  label: string;
}

export interface StockPrice {
  date: number;
  code: string;
  price: number;
}

export interface StockDividends {
  date: number;
  code: string;
  amount: number;
}

export class StockIndexedDB extends Dexie {
  holdings!: Table<StockHolding>;
  prices!: Table<StockPrice>;
  dividends!: Table<StockDividends>;

  constructor() {
    super("Stock");
    this.version(1).stores({
      holdings: "&[code+start], amount",
      prices: "&[date+code], price",
      dividends: "&[date+code], amount",
    });
  }
}

export const stockIndexedDB = new StockIndexedDB();
