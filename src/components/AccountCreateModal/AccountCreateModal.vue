<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import {
   NModal,
   NCard,
   NFormItem,
   NInput,
   NSelect,
   NButton,
   NIcon,
} from "naive-ui";
import type { Account, AccountType, LabelItem } from "../../types";
import { useAccountsStore } from "../../stores/accounts";
import { EyeOutline, EyeOffOutline } from "@vicons/ionicons5";

const props = defineProps<{
   show: boolean;
}>();
const emit = defineEmits<{
   (e: "update:show", v: boolean): void;
   (e: "created", acc: Account): void;
}>();

const store = useAccountsStore();
const pwdHidden = ref(true);

const typeOptions = [
   { label: "Локальная", value: "Локальная" as AccountType },
   { label: "LDAP", value: "LDAP" as AccountType },
];

// --- helpers
function parseLabels(input: string): LabelItem[] {
   const trimmed = input.trim();
   if (!trimmed) return [];
   const sliced = trimmed.slice(0, 50);
   return sliced
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
}

// --- локальная модель формы
const form = reactive({
   labelsInput: "",
   type: "Локальная" as AccountType,
   login: "",
   password: "",
   errors: {} as Partial<Record<"labelsInput" | "login" | "password", string>>,
});

const showPassword = computed(() => form.type === "Локальная");

function validate() {
   form.errors = {};
   if (form.labelsInput.length > 50)
      form.errors.labelsInput = "Максимум 50 символов";
   if (!form.login.trim()) form.errors.login = "Обязательное поле";
   else if (form.login.length > 100)
      form.errors.login = "Максимум 100 символов";
   if (form.type === "Локальная") {
      if (!form.password.trim()) form.errors.password = "Обязательное поле";
      else if (form.password.length > 100)
         form.errors.password = "Максимум 100 символов";
   }
   return Object.keys(form.errors).length === 0;
}

function onTypeChange(v: AccountType) {
   form.type = v;
   if (v === "LDAP") form.password = "";
}

function close() {
   emit("update:show", false);
}

function submit() {
   if (!validate()) return;
   const acc: Account = {
      id: crypto.randomUUID
         ? crypto.randomUUID()
         : String(Date.now() + Math.random()),
      labels: parseLabels(form.labelsInput),
      type: form.type,
      login: form.login.trim(),
      password: form.type === "LDAP" ? null : form.password,
   };
   store.upsert(acc);
   emit("created", acc);
   close();
}
</script>

<template>
   <NModal
      :show="props.show"
      preset="card"
      :mask-closable="false"
      @update:show="(v) => emit('update:show', v)"
   >
      <NCard title="Новая учётная запись" size="small" class="create-card">
         <div class="grid">
            <NFormItem
               label="Метки"
               :feedback="form.errors.labelsInput"
               :validation-status="
                  form.errors.labelsInput ? 'error' : undefined
               "
            >
               <NInput
                  v-model:value="form.labelsInput"
                  placeholder="XXX; YYY; ZZZ"
               />
            </NFormItem>

            <NFormItem label="Тип записи">
               <NSelect
                  :options="typeOptions"
                  v-model:value="form.type"
                  @update:value="onTypeChange"
               />
            </NFormItem>

            <NFormItem
               label="Логин"
               :feedback="form.errors.login"
               :validation-status="form.errors.login ? 'error' : undefined"
            >
               <NInput v-model:value="form.login" placeholder="Значение" />
            </NFormItem>

            <NFormItem
               v-if="showPassword"
               label="Пароль"
               :feedback="form.errors.password"
               :validation-status="form.errors.password ? 'error' : undefined"
            >
               <NInput
                  v-model:value="form.password"
                  :type="pwdHidden ? 'password' : 'text'"
                  placeholder="Введите пароль"
               >
                  <template #suffix>
                     <NIcon
                        style="cursor: pointer"
                        @click="pwdHidden = !pwdHidden"
                     >
                        <component
                           :is="pwdHidden ? EyeOutline : EyeOffOutline"
                        />
                     </NIcon>
                  </template>
               </NInput>
            </NFormItem>
         </div>

         <template #action>
            <div class="actions">
               <NButton quaternary @click="close">Отмена</NButton>
               <NButton type="primary" @click="submit">Добавить</NButton>
            </div>
         </template>
      </NCard>
   </NModal>
</template>
