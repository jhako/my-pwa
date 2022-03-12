import Dexie, { Table } from "dexie";

interface ItemScale {
  date: number;
  weight_kg: number;
  bmi: number;
  fat_per: number;
  muscle: number;
}

export class classMiScaleDB extends Dexie {
  items!: Table<ItemScale>;

  constructor() {
    super("MiScaleDB");
    this.version(1).stores({
      items: "&date, weight_kg, bmi, fat_per, muscle",
    });
  }
}

interface ItemRun {
  date: number;
  ave_heart_rate: number;
  calories: number;
  distance: number;
  elevation_gain: number;
  pace: number;
}

export class classFitbitDB extends Dexie {
  items!: Table<ItemRun>;

  constructor() {
    super("FitbitDB");
    this.version(1).stores({
      items: "&date, ave_heart_rate, calories, distance, elevation_gain, pace",
    });
  }
}

export type typeDB = classMiScaleDB | classFitbitDB;
export const miScaleDB = new classMiScaleDB();
export const fitbitDB = new classFitbitDB();
