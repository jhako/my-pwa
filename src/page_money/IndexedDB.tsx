import Dexie, { Table } from "dexie";

export interface MoneyTransaction {
  date: number;
  target: string;
  content: string;
  amount: number;
}

export interface MoneyBalance0 {
  date: string;
  target: string;
  amount: number;
}

export class MoneyIndexedDB extends Dexie {
  mtransactions!: Table<MoneyTransaction>;
  balance0!: Table<MoneyBalance0>;

  constructor() {
    super("Money");
    this.version(1).stores({
      mtransactions: "&date, target, content, amount",
      balance0: "&target, date, amount",
    });
  }
}

export const moneyIndexedDB = new MoneyIndexedDB();
