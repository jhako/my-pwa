import Dexie, { Table } from "dexie";

export interface ExRate {
  date: number;
  price: number;
}

export class ExchangeRateIndexedDB extends Dexie {
  exrates!: Table<ExRate>;

  constructor() {
    super("ExchangeRate");
    this.version(1).stores({
      exrates: "&date, price",
    });
  }
}

export const exchangeRateIndexedDB = new ExchangeRateIndexedDB();
