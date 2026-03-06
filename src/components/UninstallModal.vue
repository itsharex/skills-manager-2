<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  visible: boolean;
  targetName: string;
  mode: "ide" | "local";
}>();

defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div v-if="visible" class="modal-backdrop">
    <div class="modal">
      <div class="modal-title">
        {{ mode === "local" ? t("uninstallModal.deleteTitle") : t("uninstallModal.title") }}
      </div>
      <div class="hint">
        {{ mode === "local" ? t("uninstallModal.deleteHint") : t("uninstallModal.hint") }}
      </div>
      <div class="card-link">{{ targetName }}</div>
      <div class="modal-actions">
        <button class="ghost" @click="$emit('cancel')">{{ t("uninstallModal.cancel") }}</button>
        <button class="primary" @click="$emit('confirm')">
          {{ mode === "local" ? t("uninstallModal.deleteConfirm") : t("uninstallModal.confirm") }}
        </button>
      </div>
    </div>
  </div>
</template>
