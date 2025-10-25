<script lang="ts" setup>
import { EyeOffOutline, EyeOutline, TrashOutline } from "@vicons/ionicons5";
import { NButton, NFormItem, NIcon, NInput, NSelect } from "naive-ui";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useAccountsStore } from "../../stores/accounts";
import type {
   Account,
   AccountDraft,
   AccountType,
   LabelItem,
} from "../../types";
import "./AccountCard.css";

const props = defineProps<{ modelValue: Account }>();
const emit = defineEmits<{
   (e: "remove", id: string): void;
   (e: "update", value: Account): void;
}>();

const store = useAccountsStore();

function labelsToInput(labels: LabelItem[]): string {
   return labels.map((l) => l.text).join("; ");
}

const cacheKey = (id: string) => `acc_pwd_cache:${id}`;

function readPwdCache(id: string): string | null {
   try {
      return sessionStorage.getItem(cacheKey(id));
   } catch {
      return null;
   }
}
function writePwdCache(id: string, pwd: string) {
   try {
      if (pwd) sessionStorage.setItem(cacheKey(id), pwd);
      else sessionStorage.removeItem(cacheKey(id));
   } catch {}
}

function clearPwdCache(id: string) {
   try {
      sessionStorage.removeItem(cacheKey(id));
   } catch {}
}

/* -------- draft (read-only поля, редактируем только type) -------- */
const draft: AccountDraft = reactive({
   id: props.modelValue.id,
   labelsInput: labelsToInput(props.modelValue.labels),
   type: props.modelValue.type,
   login: props.modelValue.login,
   password: props.modelValue.password ?? "",
   errors: {},
});

/* Храним последнее известное локальное значение пароля */
const lastLocalPassword = ref<string>(props.modelValue.password ?? "");

/* При монтировании: если пароль пуст, подхватим из кэша */
onMounted(() => {
   const cached = readPwdCache(draft.id);
   if (draft.type === "Локальная") {
      if (!draft.password && cached) draft.password = cached;
      if (draft.password) {
         lastLocalPassword.value = draft.password;
         writePwdCache(draft.id, draft.password);
      }
   } else {
      // LDAP: если в модели когда-то был пароль — сохраним для будущего восстановления
      if (cached) lastLocalPassword.value = cached;
      else if (props.modelValue.password) {
         lastLocalPassword.value = props.modelValue.password;
         writePwdCache(draft.id, props.modelValue.password);
      }
   }
});

/* при обновлении modelValue не затираем пароль пустым */
watch(
   () => props.modelValue,
   (v) => {
      draft.id = v.id;
      draft.labelsInput = labelsToInput(v.labels);
      draft.type = v.type;
      draft.login = v.login;

      // вычислим «эффективный» пароль: приоритет — непустой из модели, затем кэш, затем текущий draft
      const cached = readPwdCache(v.id);
      const fromModel =
         typeof v.password === "string" && v.password.length > 0
            ? v.password
            : null;
      const effective =
         fromModel ??
         cached ??
         (draft.password || lastLocalPassword.value) ??
         "";

      draft.password = effective;

      if (v.type === "Локальная" && effective) {
         lastLocalPassword.value = effective;
         writePwdCache(v.id, effective);
      }
   },
   { deep: true }
);

/* -------- смена типа — единственное редактирование -------- */
function onTypeChange(value: AccountType) {
   draft.type = value;

   if (value === "LDAP") {
      // перед обнулением в сторе — сохраним локальный пароль
      const current = draft.password || lastLocalPassword.value || "";
      if (current) {
         lastLocalPassword.value = current;
         writePwdCache(draft.id, current);
      }

      const acc: Account = {
         id: draft.id,
         labels: props.modelValue.labels,
         type: "LDAP",
         login: props.modelValue.login,
         password: null,
      };
      store.upsert(acc);
      emit("update", acc);
      return;
   }

   // value === "Локальная": восстановим
   const restored =
      readPwdCache(draft.id) ||
      lastLocalPassword.value ||
      props.modelValue.password ||
      "";

   draft.password = restored;
   lastLocalPassword.value = restored;
   if (restored) writePwdCache(draft.id, restored);

   const acc: Account = {
      id: draft.id,
      labels: props.modelValue.labels,
      type: "Локальная",
      login: props.modelValue.login,
      password: restored,
   };
   store.upsert(acc);
   emit("update", acc);
}

/* -------- удаление -------- */
function removeRow() {
   clearPwdCache(draft.id);
   store.remove(draft.id);
   emit("remove", draft.id);
}

const showPassword = computed(() => draft.type === "Локальная");
const pwdHidden = ref(true);

const typeOptions = [
   { label: "Локальная", value: "Локальная" as AccountType },
   { label: "LDAP", value: "LDAP" as AccountType },
];
</script>

<template>
   <div class="row">
      <NFormItem label="Метки">
         <NInput v-model:value="draft.labelsInput" readonly />
      </NFormItem>

      <NFormItem label="Тип записи">
         <NSelect
            v-model:value="draft.type"
            :options="typeOptions"
            @update:value="onTypeChange"
         />
      </NFormItem>

      <NFormItem label="Логин">
         <NInput v-model:value="draft.login" readonly />
      </NFormItem>

      <NFormItem v-if="showPassword" label="Пароль">
         <NInput
            :type="pwdHidden ? 'password' : 'text'"
            v-model:value="draft.password"
            readonly
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
