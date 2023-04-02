import { useState, useEffect } from "react";
import {
  stockIndexedDB,
  StockHolding,
  StockPrice,
  StockDividends,
} from "./StockIndexedDB";
import { exchangeRateIndexedDB, ExRate } from "./ExchangeRateIndexedDB";

export interface StockCollection {
  holdings: Array<StockHolding>;
  prices: { [code: string]: Array<{ date: number; value: number }> };
  dividends: { [code: string]: Array<{ date: number; value: number }> };
  exrates: { [date: string]: number };
  isUSD: { [code: string]: boolean };
}

export function date2str(date: Date) {
  return date.toISOString().substring(0, 10);
}

export function get_jpy_rate(code: string, date: number, sc: StockCollection) {
  return sc.isUSD[code] ? sc.exrates[date2str(new Date(date))] : 1.0;
}

export function useStockCollection() {
  const [fetchStatus, setFetchStatus] = useState<number>(0);
  const [countDB, setCountDB] = useState<number>(0);
  const [collection, setCollection] = useState<StockCollection>();
  const [jpyRate, setJPYRate] = useState<number>(0);

  useEffect(() => {
    (async () => {
      // fetch db
      setFetchStatus(0);
      const fetch_status = await fetchDB();
      setFetchStatus(fetch_status);
      if (fetch_status == 1) {
        setCountDB((c) => c + 1); //DB更新
      }
      // fetch rate
      const rate_fetched = await fetch("https://open.er-api.com/v6/latest/USD");
      setJPYRate((await rate_fetched.json()).rates.JPY);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      //if (jpyRate == 0) return;
      const collection: StockCollection = {
        holdings: [],
        prices: {},
        dividends: {},
        exrates: {},
        isUSD: {},
      };
      const [holdings, prices, dividends, exrates] = await Promise.all([
        await stockIndexedDB.holdings.toArray(),
        await stockIndexedDB.prices.toArray(),
        await stockIndexedDB.dividends.toArray(),
        await exchangeRateIndexedDB.exrates.toArray(),
      ]);
      collection.holdings = holdings;
      for (const x of collection.holdings) {
        collection.isUSD[x.code] = !x.code.endsWith(".T");
        //x.acq_price *= x.rate;
      }
      for (const x of prices) {
        collection.prices[x.code] ??= [];
        collection.prices[x.code].push({ date: x.date, value: x.price });
      }
      for (const x of dividends) {
        collection.dividends[x.code] ??= [];
        collection.dividends[x.code].push({ date: x.date, value: x.amount });
      }
      for (const x of exrates) {
        // Date -> JPY/USD
        collection.exrates[x.date] = x.price;
      }
      // 今日までの為替レートをDBの最新レートで偽装
      const tmp_rate = exrates[exrates.length - 1].price;
      const day = new Date();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const dstr = date2str(day);
        if (dstr in collection.exrates) break;
        collection.exrates[dstr] = tmp_rate;
        day.setDate(day.getDate() - 1);
      }
      setCollection(collection);
    })();
  }, [countDB]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // 今日までの為替レートをAPI取得の最新レートで偽装()
    if (jpyRate == 0 || collection === undefined) return;
    let tmp_rate = null;
    const day = new Date();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const dstr = date2str(day);
      if (tmp_rate === null) {
        tmp_rate = collection.exrates[dstr];
      }
      if (collection.exrates[dstr] === tmp_rate)
        collection.exrates[dstr] = jpyRate;
      else break;
      day.setDate(day.getDate() - 1);
    }
  }, [collection]);

  return {
    fetchStatus: fetchStatus,
    data: collection,
  };
}

interface FetchedStockInfo {
  holdings: Array<StockHolding>;
  stock_prices: Array<StockPrice>;
  stock_dividends: Array<StockDividends>;
}
interface FetchedExRate {
  exrates: Array<ExRate>;
}

async function fetchDB() {
  let status = null;
  try {
    const num_items = await stockIndexedDB.prices.count();
    let fetch_url = "https://192.168.10.103:7213/money/stockinfo";
    let fetch_url_ex = "https://192.168.10.103:7213/money/exrates";
    if (num_items > 0) {
      const date = new Date();
      date.setMonth(date.getMonth() - 1); //1か月前より取得
      const option_str = "?date_from=" + date.toISOString().substring(0, 7);
      fetch_url += option_str;
      fetch_url_ex += option_str;
    }
    const fdata: FetchedStockInfo = await (await fetch(fetch_url)).json();
    // stock holdings
    fdata.holdings.forEach((x) => {
      x.start = new Date(x.start).getTime();
      x.end = new Date(x.end).getTime();
    });
    // stock prices
    fdata.stock_prices.forEach((x) => (x.date = new Date(x.date).getTime()));
    // stock dividends
    fdata.stock_dividends.forEach((x) => (x.date = new Date(x.date).getTime()));
    // exchange-rate
    const fdata_exrate: FetchedExRate = await (
      await fetch(fetch_url_ex)
    ).json();
    await Promise.all([
      stockIndexedDB.holdings.bulkPut(fdata.holdings),
      stockIndexedDB.prices.bulkPut(fdata.stock_prices),
      stockIndexedDB.dividends.bulkPut(fdata.stock_dividends),
      exchangeRateIndexedDB.exrates.bulkPut(fdata_exrate.exrates),
    ]);
  } catch (e) {
    console.log("error fetch from money/stockinfo: ", e);
    status = 2;
  }
  status ??= 1; //OK

  return status;
}
