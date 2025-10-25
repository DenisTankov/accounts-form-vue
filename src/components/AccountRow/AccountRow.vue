<script lang="ts" setup>
import { EyeOffOutline, EyeOutline, TrashOutline } from "@vicons/ionicons5";
import { NButton, NFormItem, NIcon, NInput, NSelect } from "naive-ui";
import { computed, reactive, ref } from "vue";
import { useAccountsStore } from "../../stores/accounts";
import type {
   Account,
   AccountDraft,
   AccountType,
   LabelItem,
} from "../../types";
import "./AccountRow.css";

// props / emits
const props = defineProps<{ modelValue: Account }>();
const emit = defineEmits<{
   (e: "remove", id: string): void;
   (e: "update", value: Account): void;
}>();

const store = useAccountsStore();

// helpers
function labelsToInput(labels: LabelItem[]): string {
   return labels.map((l) => l.text).join("; ");
}
function parseLabels(input: string): LabelItem[] {
   const trimmed = input.trim();
   if (!trimmed) return [];
   const sliced = trimmed.slice(0, 50); // по ТЗ
   return sliced
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
}

// draft
const draft: AccountDraft = reactive({
   id: props.modelValue.id,
   labelsInput: labelsToInput(props.modelValue.labels),
   type: props.modelValue.type,
   login: props.modelValue.login,
   password: props.modelValue.password ?? "",
   errors: {},
});

// validation
function validate(): boolean {
   draft.errors = {};

   if (draft.labelsInput.length > 50)
      draft.errors.labelsInput = "Максимум 50 символов";

   if (!draft.login.trim()) draft.errors.login = "Обязательное поле";
   else if (draft.login.length > 100)
      draft.errors.login = "Максимум 100 символов";

   if (draft.type === "Локальная") {
      if (!draft.password.trim()) draft.errors.password = "Обязательное поле";
      else if (draft.password.length > 100)
         draft.errors.password = "Максимум 100 символов";
   }

   return Object.keys(draft.errors).length === 0;
}

// save
function saveIfValid() {
   if (!validate()) return;
   const acc: Account = {
      id: draft.id,
      labels: parseLabels(draft.labelsInput),
      type: draft.type,
      login: draft.login.trim(),
      password: draft.type === "LDAP" ? null : draft.password,
   };
   store.upsert(acc);
   emit("update", acc);
}

// handlers
function onBlurText() {
   saveIfValid();
}
function onTypeChange(value: AccountType) {
   draft.type = value;
   if (value === "LDAP") draft.password = "";
   saveIfValid();
}
function removeRow() {
   store.remove(draft.id);
   emit("remove", draft.id);
}

// ui
const showPassword = computed(() => draft.type === "Локальная");
const pwdHidden = ref(true);

const typeOptions = [
   { label: "Локальная", value: "Локальная" as AccountType },
   { label: "LDAP", value: "LDAP" as AccountType },
];
</script>

<template>
   <div class="row">
      <!-- Метки -->
      <NFormItem
         label="Метки"
         :validation-status="draft.errors.labelsInput ? 'error' : undefined"
         :feedback="draft.errors.labelsInput"
      >
         <NInput
            v-model:value="draft.labelsInput"
            placeholder="XXX; YYY; ZZZ"
            @blur="onBlurText"
         />
      </NFormItem>

      <!-- Тип записи -->
      <NFormItem label="Тип записи">
         <NSelect
            v-model:value="draft.type"
            :options="typeOptions"
            @update:value="onTypeChange"
         />
      </NFormItem>

      <!-- Логин -->
      <NFormItem
         label="Логин"
         :validation-status="draft.errors.login ? 'error' : undefined"
         :feedback="draft.errors.login"
      >
         <NInput
            v-model:value="draft.login"
            placeholder="Значение"
            @blur="onBlurText"
         />
      </NFormItem>

      <!-- Пароль (только для Локальная) -->
      <NFormItem
         v-if="showPassword"
         label="Пароль"
         :validation-status="draft.errors.password ? 'error' : undefined"
         :feedback="draft.errors.password"
      >
         <NInput
            :type="pwdHidden ? 'password' : 'text'"
            v-model:value="draft.password"
            placeholder="Введите пароль"
            @blur="onBlurText"
         >
            <template #suffix>
               <NIcon
                  size="18"
                  class="eye-icon"
                  @click="pwdHidden = !pwdHidden"
               >
                  <component :is="pwdHidden ? EyeOutline : EyeOffOutline" />
               </NIcon>
            </template>
         </NInput>
      </NFormItem>

      <!-- Удаление -->
      <div class="actions">
         <NButton quaternary class="delete-btn" @click="removeRow">
            <template #icon>
               <NIcon size="18">
                  <TrashOutline />
               </NIcon>
            </template>
         </NButton>
      </div>
   </div>
</template>
