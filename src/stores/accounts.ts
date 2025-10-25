import { defineStore } from "pinia";
import type { Account } from "../types";

const STORAGE_KEY = "accounts_store_v1";

function load(): Account[] {
   try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Account[]) : [];
   } catch {
      return [];
   }
}

function save(list: Account[]) {
   localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const useAccountsStore = defineStore("accounts", {
   state: () => ({
      items: load() as Account[],
   }),
   actions: {
      addBlank(): string {
         const id = crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now() + Math.random());
         this.items.push({
            id,
            labels: [],
            type: "Локальная",
            login: "",
            password: "",
         });
         save(this.items);
         return id;
      },
      upsert(acc: Account) {
         const idx = this.items.findIndex((a) => a.id === acc.id);
         if (idx >= 0) this.items[idx] = acc;
         else this.items.push(acc);
         save(this.items);
      },
      remove(id: string) {
         this.items = this.items.filter((a) => a.id !== id);
         save(this.items);
      },
   },
});
