<script setup lang="ts">
import { EyeOffOutline, EyeOutline } from "@vicons/ionicons5";
import {
   NButton,
   NCard,
   NForm,
   NFormItem,
   NIcon,
   NInput,
   NModal,
} from "naive-ui";
import { computed, reactive, ref } from "vue";

import { useAccountsStore } from "../../stores/accounts";
import type { Account, LabelItem } from "../../types";

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{
   (e: "update:show", v: boolean): void;
   (e: "created", acc: Account): void;
}>();

const store = useAccountsStore();

const form = reactive({
   labelsInput: "" as string, // "AAA; BBB; CCC" — необязательно
   login: "" as string, // обязательно
   password: "" as string, // обязательно
});

const touched = reactive({ login: false, password: false });
const errors = reactive<{ login?: string; password?: string }>({});
const showPassword = ref(false);

function touch(field: "login" | "password") {
   touched[field] = true;
   validateField(field);
}
function validateField(field: "login" | "password") {
   if (field === "login") {
      errors.login = form.login.trim() ? undefined : "Обязательное поле";
   } else {
      errors.password = form.password.trim() ? undefined : "Обязательное поле";
   }
}
const isValid = computed(() => !!form.login.trim() && !!form.password.trim());

/** ВСЕГДА возвращаем LabelItem[], даже если пусто — тогда [] */
function parseLabelsToItems(input: string): LabelItem[] {
   const parts = input
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

   return parts.map((text) => ({ text }));
}

function reset() {
   form.labelsInput = "";
   form.login = "";
   form.password = "";
   touched.login = false;
   touched.password = false;
   errors.login = undefined;
   errors.password = undefined;
}
function close() {
   emit("update:show", false);
   reset();
}

function submit() {
   touch("login");
   touch("password");
   if (!isValid.value) return;

   const acc: Account = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      type: "Локальная", // твой AccountType: "LDAP" | "Локальная"
      login: form.login.trim(),
      password: form.password,
      labels: parseLabelsToItems(form.labelsInput), // <-- всегда массив (в т.ч. [])
   };

   store.upsert(acc);
   emit("created", acc);
   close();
}
</script>

<template>
   <NModal :show="props.show" @update:show="emit('update:show', $event)">
      <NCard
         title="Новая учётная запись"
         size="large"
         :segmented="{ content: true, footer: true }"
      >
         <NForm label-placement="top" :show-require-mark="false">
            <!-- Метки (необязательные) -->
            <NFormItem label="Метки">
               <NInput
                  v-model:value="form.labelsInput"
                  placeholder="XXX; YYY; ZZZ"
               />
            </NFormItem>

            <!-- Логин (обязательное) -->
            <NFormItem
               label="Логин"
               :validation-status="
                  touched.login && errors.login ? 'error' : undefined
               "
               :feedback="touched.login ? errors.login : undefined"
            >
               <NInput
                  v-model:value="form.login"
                  placeholder="Значение"
                  @blur="touch('login')"
               />
            </NFormItem>

            <!-- Пароль (обязательное) -->
            <NFormItem
               label="Пароль"
               :validation-status="
                  touched.password && errors.password ? 'error' : undefined
               "
               :feedback="touched.password ? errors.password : undefined"
            >
               <NInput
                  v-model:value="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Введите пароль"
                  @blur="touch('password')"
               >
                  <template #suffix>
                     <NButton
                        text
                        @click="showPassword = !showPassword"
                        style="padding: 0 6px"
                     >
                        <NIcon size="18">
                           <component
                              :is="showPassword ? EyeOffOutline : EyeOutline"
                           />
                        </NIcon>
                     </NButton>
                  </template>
               </NInput>
            </NFormItem>
         </NForm>

         <template #action>
            <div class="actions">
               <NButton quaternary @click="close">Отмена</NButton>
               <NButton type="primary" :disabled="!isValid" @click="submit"
                  >Добавить</NButton
               >
            </div>
         </template>
      </NCard>
   </NModal>
</template>
