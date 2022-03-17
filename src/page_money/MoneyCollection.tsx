import React, { useState, useEffect } from "react";
import { moneyIndexedDB, MoneyTransaction, MoneyBalance0 } from "./IndexedDB";

export interface MoneyTable {
  trans: Array<MoneyTransaction>;
  balance?: number;
}

export interface MoneyCollection {
  tables: { [name: string]: MoneyTable };
  date_from: number;
}

export function useMoneyCollection() {
  const [fetchStatus, setFetchStatus] = useState<number>(0);
  const [countDB, setCountDB] = useState<number>(0);
  const [collection, setCollection] = useState<MoneyCollection>();

  useEffect(() => {
    (async () => {
      setFetchStatus(0);
      const fetch_status = await fetchDB();
      setFetchStatus(fetch_status);
      if (fetch_status == 1) {
        setCountDB((c) => c + 1); //DB更新
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const mc: MoneyCollection = { tables: {}, date_from: Date.now() };
      const balance0_arr = await moneyIndexedDB.balance0.toArray();
      for (const b0 of balance0_arr) {
        mc.tables[b0.target] ??= { trans: [], balance: 0.0 };
        mc.tables[b0.target].balance = b0.amount; // 初期残高
      }
      const trans_arr = await moneyIndexedDB.mtransactions.toArray();
      for (const trans of trans_arr) {
        mc.tables[trans.target] ??= { trans: [], balance: 0.0 };
        mc.tables[trans.target].trans.push(trans);
        mc.date_from = Math.min(mc.date_from, trans.date);
        const tables = mc.tables[trans.target];
        if (tables.balance) {
          tables.balance += trans.amount; // 現在残高を計算
        }
      }
      setCollection(mc);
    })();
  }, [countDB]);

  return {
    fetchStatus: fetchStatus,
    data: collection,
  };
}

interface FetchedMoneyTrans {
  target: string;
  date: string;
  content: string;
  amount: number;
}

async function fetchDB() {
  let status = null;
  // Fetch transactions
  try {
    const num_items = await moneyIndexedDB.mtransactions.count();
    let fetch_url = "https://192.168.10.103:7213/money/transactions";
    if (num_items > 0) {
      const date = new Date();
      date.setMonth(date.getMonth() - 1); //1か月前より取得
      fetch_url +=
        "?date_from=" + date.toISOString().substring(0, 7).replace("-", "/");
    }
    const res = await fetch(fetch_url);
    const fdata: Array<FetchedMoneyTrans> = await res.json();
    const convert_sortabledate_to_time = (date_sortable: string) => {
      const day_time = new Date(date_sortable.substring(0, 10)).getTime();
      const residual = Number(date_sortable.substring(11)) * 0.000864;
      return day_time + residual;
    };
    fdata.map((item: FetchedMoneyTrans) => {
      // convert date-string to unix-time
      const item_t: MoneyTransaction = {
        ...item,
        date: convert_sortabledate_to_time(item.date),
      };
      moneyIndexedDB.mtransactions.put(item_t);
    });
    // Fetch Balance0
  } catch (e) {
    console.log("error fetch from money/transaction: ", e);
    status = 2;
  }

  // Fetch Balance0
  try {
    const res = await fetch("https://192.168.10.103:7213/money/balance0");
    const fdata: Array<MoneyBalance0> = await res.json();
    fdata.map((item: MoneyBalance0) => {
      moneyIndexedDB.balance0.put(item);
    });
  } catch (e) {
    console.log("error fetch from money/balance0: ", e);
    status = 2;
  }

  status ??= 1; //OK

  return status;
}
