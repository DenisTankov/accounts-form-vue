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
import { computed, reactive, ref, watch } from "vue";
import { useAccountsStore } from "../../stores/accounts";
import type { Account, LabelItem } from "../../types";

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{
   (e: "update:show", v: boolean): void;
   (e: "created", acc: Account): void;
}>();

const store = useAccountsStore();

const form = reactive({
   labelsInput: "" as string, // необязательно
   login: "" as string, // обязательно
   password: "" as string, // обязательно (ASCII)
});

const touched = reactive({ login: false, password: false });
const errors = reactive<{ login?: string; password?: string }>({});
const showPassword = ref(false);

// ASCII helper
const isAscii = (s: string) => /^[\x20-\x7E]+$/.test(s || "");

// мгновенная ошибка на не-ASCII
const passwordAsciiError = ref(false);

/* -------------------- Валидация -------------------- */
function validateLogin() {
   errors.login = form.login.trim() ? undefined : "Обязательное поле";
}

// «обязательное поле» для пароля — только на blur
function validatePasswordRequiredOnBlur() {
   touched.password = true;
   if (!form.password.trim()) {
      errors.password = "Обязательное поле";
   } else {
      errors.password = undefined;
   }
}

// следим за паролем: мгновенно сигналим при не-ASCII
watch(
   () => form.password,
   (val) => {
      if (val && !isAscii(val)) {
         passwordAsciiError.value = true;
      } else {
         passwordAsciiError.value = false;
         if (!touched.password) errors.password = undefined;
      }
   }
);

// кнопка активна, когда оба поля ок и пароль ASCII
const isValid = computed(
   () => !!form.login.trim() && !!form.password.trim() && isAscii(form.password)
);

/** Преобразование меток в LabelItem[] */
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
   passwordAsciiError.value = false;
}

function close() {
   emit("update:show", false);
   reset();
}

function submit() {
   // финальная проверка
   touched.login = true;
   validateLogin();
   validatePasswordRequiredOnBlur();
   if (!isValid.value) return;

   const acc: Account = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      type: "Локальная",
      login: form.login.trim(),
      password: form.password,
      labels: parseLabelsToItems(form.labelsInput),
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

            <!-- Логин (обязательное, ошибка на blur) -->
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
                  @blur="
                     touched.login = true;
                     validateLogin();
                  "
               />
            </NFormItem>

            <!-- Пароль (ASCII). 
             Обязательное поле — ошибка только после blur,
             не-ASCII — мгновенная ошибка. Маска через CSS-класс. -->
            <NFormItem
               label="Пароль"
               :validation-status="
                  passwordAsciiError || (touched.password && errors.password)
                     ? 'error'
                     : undefined
               "
               :feedback="
                  passwordAsciiError
                     ? 'Пароль должен быть латиницей (A–Z, a–z, цифры, символы)'
                     : touched.password
                     ? errors.password
                     : undefined
               "
            >
               <NInput
                  v-model:value="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Введите пароль"
                  autocomplete="new-password"
                  autocapitalize="off"
                  spellcheck="false"
                  @blur="validatePasswordRequiredOnBlur"
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
