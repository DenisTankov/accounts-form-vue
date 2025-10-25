export type AccountType = "LDAP" | "Локальная";

export interface LabelItem {
   text: string;
}

export interface Account {
   id: string;
   labels: LabelItem[]; // из поля "Метки" после парсинга
   type: AccountType;
   login: string;
   password: string | null; // при LDAP — null, при Локальная — строка
}

export interface AccountDraft {
   id: string;
   labelsInput: string; // текст из инпута меток (до парсинга)
   type: AccountType;
   login: string;
   password: string;
   // ошибки валидации для подсветки
   errors: Partial<Record<"login" | "password" | "labelsInput", string>>;
}
