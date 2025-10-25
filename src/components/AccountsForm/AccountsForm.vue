<script lang="ts" setup>
import { useAccountsStore } from "../../stores/accounts";
import type { Account } from "../../types";
import AccountCard from "../AccountCard/AccountCard.vue";
import { ref } from "vue";
import AccountCreateModal from "../AccountCreateModal/AccountCreateModal.vue";

const store = useAccountsStore();

// ⬅️ вместо прямого addBlank() открываем модалку
const showCreate = ref(false);
function add() {
   showCreate.value = true;
}

function onRemove(_id: string) {
   // список сам обновится из store
}
function onUpdate(_acc: Account) {
   // noop — сохранение делает store.upsert
}

// ⬅️ коллбек после успешного создания (ничего делать не нужно)
function onCreated(_acc: Account) {
   // запись уже в store; модалка сама закрывается через v-model
}
</script>

<template>
   <div class="container">
      <div class="header">
         <h2>Учётные записи</h2>
         <button class="addBtn" type="button" @click="add">＋</button>
      </div>

      <div class="hint">
         ❓ Для указания нескольких меток для одной пары логин/пароль
         используйте разделитель <b>;</b>
      </div>

      <div class="list">
         <AccountCard
            v-for="acc in store.items"
            :key="acc.id"
            :model-value="acc"
            @remove="onRemove"
            @update="onUpdate"
         />
      </div>

      <!-- ⬅️ модалка создания -->
      <AccountCreateModal v-model:show="showCreate" @created="onCreated" />
   </div>
</template>
